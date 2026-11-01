require('dotenv').config();
const fs = require('fs');
const { sequelize, Post } = require('../src/models');
const {
  resolveUploadDir,
  filenameFromUploadsUrl,
  thumbnailDiskPath,
} = require('../src/config/uploadDir');

const UPLOADS_IN_CONTENT_RE = /\/uploads\/[^"'\s)>]+/g;

async function verifyThumbnails() {
  const uploadDir = resolveUploadDir();
  console.log('=== Diagnóstico de Thumbnails ===\n');
  console.log('Diretório de uploads:', uploadDir);
  console.log('');

  try {
    await sequelize.authenticate();
  } catch (err) {
    console.error('Erro ao conectar ao banco:', err.message);
    process.exit(1);
  }

  const posts = await Post.findAll({
    attributes: ['id', 'title', 'thumbnail', 'slug', 'content'],
    raw: true,
  });

  const withoutThumbnail = [];
  const missingFile = [];
  const ok = [];
  const missingInContent = [];

  for (const post of posts) {
    if (!post.thumbnail || post.thumbnail.trim() === '') {
      withoutThumbnail.push(post);
    } else {
      const filename = filenameFromUploadsUrl(post.thumbnail);
      if (!filename) {
        missingFile.push({ ...post, reason: 'URL/caminho inválido' });
      } else {
        const filePath = thumbnailDiskPath(post.thumbnail);
        if (!filePath || !fs.existsSync(filePath)) {
          missingFile.push({
            ...post,
            reason: 'Arquivo não encontrado',
            expectedPath: filePath,
          });
        } else {
          ok.push(post);
        }
      }
    }

    const content = post.content || '';
    const matches = content.match(UPLOADS_IN_CONTENT_RE) || [];
    const seen = new Set();
    for (const match of matches) {
      const filename = filenameFromUploadsUrl(match);
      if (!filename || seen.has(filename)) continue;
      seen.add(filename);
      const filePath = thumbnailDiskPath(match);
      if (!filePath || !fs.existsSync(filePath)) {
        missingInContent.push({
          id: post.id,
          title: post.title,
          slug: post.slug,
          ref: match,
          expectedPath: filePath,
        });
      }
    }
  }

  console.log('--- Posts sem thumbnail no DB ---');
  if (withoutThumbnail.length === 0) {
    console.log('Nenhum.');
  } else {
    withoutThumbnail.forEach((p) => console.log(`  [${p.id}] ${p.title} (slug: ${p.slug})`));
  }

  console.log('\n--- Posts com thumbnail no DB mas arquivo ausente ---');
  if (missingFile.length === 0) {
    console.log('Nenhum.');
  } else {
    missingFile.forEach((p) => {
      console.log(`  [${p.id}] ${p.title}`);
      console.log(`       thumbnail: ${p.thumbnail}`);
      console.log(`       motivo: ${p.reason}${p.expectedPath ? ` (${p.expectedPath})` : ''}`);
    });
  }

  console.log('\n--- Imagens citadas no HTML sem arquivo no disco ---');
  if (missingInContent.length === 0) {
    console.log('Nenhum.');
  } else {
    missingInContent.forEach((p) => {
      console.log(`  [${p.id}] ${p.title}`);
      console.log(`       ref: ${p.ref}`);
      console.log(`       esperado: ${p.expectedPath || '(inválido)'}`);
    });
  }

  console.log('\n--- Posts OK (thumbnail presente e arquivo existe) ---');
  if (ok.length === 0) {
    console.log('Nenhum.');
  } else {
    ok.forEach((p) => console.log(`  [${p.id}] ${p.title}`));
  }

  console.log('\n=== Resumo ===');
  console.log(`Total de posts: ${posts.length}`);
  console.log(`Sem thumbnail: ${withoutThumbnail.length}`);
  console.log(`Arquivo ausente (thumbnail): ${missingFile.length}`);
  console.log(`Arquivo ausente (HTML): ${missingInContent.length}`);
  console.log(`OK: ${ok.length}`);

  await sequelize.close();
  const hasProblems =
    missingFile.length > 0 ||
    missingInContent.length > 0 ||
    (posts.length > 0 && withoutThumbnail.length === posts.length);
  process.exit(hasProblems ? 1 : 0);
}

verifyThumbnails().catch((err) => {
  console.error(err);
  process.exit(1);
});
