require('dotenv').config();

const BASE_URL = process.env.API_URL || process.env.BASE_URL || 'http://localhost:3001';

async function fetchJson(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function testThumbnailUrl(url) {
  if (!url || url.trim() === '') return { ok: false, reason: 'URL vazia' };
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

async function runTests() {
  console.log('=== Teste da API - Thumbnails ===\n');
  console.log('Base URL:', BASE_URL);
  console.log('');

  const failures = [];

  // GET /api/posts/recent
  const recentRes = await fetchJson(`${BASE_URL}/api/posts/recent`);
  if (recentRes.status !== 200) {
    failures.push({ endpoint: '/api/posts/recent', error: `Status ${recentRes.status}` });
  } else {
    const posts = Array.isArray(recentRes.data?.data) ? recentRes.data.data : [];
    for (const post of posts) {
      if (!Object.prototype.hasOwnProperty.call(post, 'thumbnail')) {
        failures.push({ endpoint: '/api/posts/recent', postId: post.id, error: 'Campo thumbnail ausente' });
      } else if (post.thumbnail) {
        const check = await testThumbnailUrl(post.thumbnail);
        if (!check.ok) {
          failures.push({
            endpoint: '/api/posts/recent',
            postId: post.id,
            title: post.title,
            thumbnail: post.thumbnail,
            error: check.reason || `HTTP ${check.status}`,
          });
        }
      }
    }
    console.log(`GET /api/posts/recent: ${posts.length} posts, thumbnail presente em ${posts.filter((p) => p.thumbnail).length}`);
  }

  // GET /api/posts/featured
  const featuredRes = await fetchJson(`${BASE_URL}/api/posts/featured`);
  if (featuredRes.status !== 200) {
    failures.push({ endpoint: '/api/posts/featured', error: `Status ${featuredRes.status}` });
  } else {
    const post = featuredRes.data?.data;
    if (post) {
      if (!Object.prototype.hasOwnProperty.call(post, 'thumbnail')) {
        failures.push({ endpoint: '/api/posts/featured', postId: post.id, error: 'Campo thumbnail ausente' });
      } else if (post.thumbnail) {
        const check = await testThumbnailUrl(post.thumbnail);
        if (!check.ok) {
          failures.push({
            endpoint: '/api/posts/featured',
            postId: post.id,
            title: post.title,
            thumbnail: post.thumbnail,
            error: check.reason || `HTTP ${check.status}`,
          });
        }
      }
      console.log(`GET /api/posts/featured: post ${post.id} "${post.title}"`);
    } else {
      console.log('GET /api/posts/featured: nenhum post em destaque');
    }
  }

  // GET /api/posts (primeira página)
  const listRes = await fetchJson(`${BASE_URL}/api/posts?limit=5`);
  if (listRes.status === 200 && Array.isArray(listRes.data?.data)) {
    const posts = listRes.data.data;
    let missingCount = 0;
    for (const post of posts) {
      if (!Object.prototype.hasOwnProperty.call(post, 'thumbnail')) missingCount++;
    }
    console.log(`GET /api/posts: ${posts.length} posts, campo thumbnail em todos: ${missingCount === 0 ? 'sim' : `não (${missingCount} sem)`}`);
  }

  console.log('\n--- Resultado ---');
  if (failures.length === 0) {
    console.log('Todos os testes passaram.');
    process.exit(0);
  } else {
    console.log(`${failures.length} falha(s):`);
    failures.forEach((f) => {
      console.log(`  - ${f.endpoint}${f.postId ? ` [post ${f.postId}]` : ''}${f.title ? ` "${f.title}"` : ''}: ${f.error}`);
      if (f.thumbnail) console.log(`    thumbnail: ${f.thumbnail}`);
    });
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
