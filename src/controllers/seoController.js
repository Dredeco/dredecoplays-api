const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { Post, User, Category, Tag } = require('../models');

const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://dredecoplays.com.br').replace(/\/$/, '');
const SITE_LOGO_URL = process.env.SITE_LOGO_URL || `${FRONTEND_URL}/logo.png`;

function getApiBaseUrl(req) {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeCdata(str) {
  return String(str).replace(/]]>/g, ']]]]><![CDATA[>');
}

function formatYmd(date) {
  if (!date) return '';
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toRfc822(date) {
  if (!date) return '';
  return new Date(date).toUTCString();
}

/**
 * Meta description: excerpt ou primeiros 155 chars do conteúdo sem HTML, palavra completa + …
 */
function buildMetaDescription(post) {
  const excerpt = post.excerpt && String(post.excerpt).trim();
  if (excerpt) {
    return excerpt.length > 160 ? `${excerpt.slice(0, 157)}…` : excerpt;
  }
  const plain = stripHtml(post.content);
  if (!plain) return '';
  if (plain.length <= 155) return plain;
  const slice = plain.slice(0, 155);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  return `${cut}…`;
}

function rssDescription(post) {
  const plain = stripHtml(post.excerpt || post.content);
  if (!plain) return '';
  return plain.length > 300 ? `${plain.slice(0, 297)}…` : plain;
}

function slugifyAuthorPath(name) {
  return String(name || 'autor')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'autor';
}

function readingTimeMinutes(wordCount) {
  if (!wordCount || wordCount <= 0) return 1;
  return Math.max(1, Math.ceil(wordCount / 200));
}

function plainWordCount(text) {
  const plain = stripHtml(text);
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}

function absoluteThumbnailUrl(thumbnail, req) {
  if (!thumbnail) return null;
  const t = String(thumbnail);
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  const base = getApiBaseUrl(req);
  if (t.startsWith('/')) return `${base}${t}`;
  return `${base}/uploads/${t.replace(/^\//, '')}`;
}

/** Caminho em disco para `public/uploads/...` a partir do valor bruto ou URL da API */
function resolveThumbnailDiskPath(thumbnailRaw, apiBase) {
  if (!thumbnailRaw) return null;
  const t = String(thumbnailRaw);
  let rel = t;
  const base = apiBase.replace(/\/$/, '');
  if (t.startsWith('http://') || t.startsWith('https://')) {
    if (!t.startsWith(base)) return null;
    rel = t.slice(base.length) || '';
  }
  if (!rel.startsWith('/uploads/')) return null;
  return path.join(process.cwd(), 'public', rel.replace(/^\//, ''));
}

const postIncludes = [
  { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
  { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'color'] },
  { model: Tag, as: 'tags', attributes: ['id', 'name', 'slug'], through: { attributes: [] } },
];

exports.sitemap = async (req, res, next) => {
  try {
    const [posts, categories, tags] = await Promise.all([
      Post.findAll({
        where: { status: 'published' },
        attributes: ['slug', 'updated_at', 'created_at'],
        order: [['updated_at', 'DESC']],
      }),
      Category.findAll({ attributes: ['slug'] }),
      Tag.findAll({ attributes: ['slug'] }),
    ]);

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const urls = [];

    urls.push({
      loc: `${FRONTEND_URL}/`,
      changefreq: 'daily',
      priority: '1.0',
    });
    urls.push({
      loc: `${FRONTEND_URL}/blog`,
      changefreq: 'daily',
      priority: '0.9',
    });
    urls.push({
      loc: `${FRONTEND_URL}/sobre`,
      changefreq: 'weekly',
      priority: '0.8',
    });

    for (const cat of categories) {
      urls.push({
        loc: `${FRONTEND_URL}/categoria/${cat.slug}`,
        changefreq: 'weekly',
        priority: '0.8',
      });
    }

    for (const tag of tags) {
      urls.push({
        loc: `${FRONTEND_URL}/tag/${tag.slug}`,
        changefreq: 'weekly',
        priority: '0.5',
      });
    }

    for (const post of posts) {
      const lastmod = post.updated_at || post.created_at;
      const lastmodTime = lastmod ? new Date(lastmod).getTime() : 0;
      const isRecent = lastmodTime >= thirtyDaysAgo;
      urls.push({
        loc: `${FRONTEND_URL}/blog/${post.slug}`,
        lastmod: formatYmd(lastmod),
        changefreq: 'weekly',
        priority: isRecent ? '0.9' : '0.7',
      });
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    for (const u of urls) {
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(u.loc)}</loc>\n`;
      if (u.lastmod) xml += `    <lastmod>${escapeXml(u.lastmod)}</lastmod>\n`;
      xml += `    <changefreq>${escapeXml(u.changefreq)}</changefreq>\n`;
      xml += `    <priority>${escapeXml(u.priority)}</priority>\n`;
      xml += '  </url>\n';
    }
    xml += '</urlset>';

    res.set({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    });
    res.send(xml);
  } catch (err) {
    next(err);
  }
};

exports.feed = async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      where: { status: 'published' },
      include: postIncludes,
      order: [['created_at', 'DESC']],
      limit: 20,
    });

    const latest = posts[0];
    const lastBuild = latest ? (latest.updated_at || latest.created_at) : new Date();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">\n';
    xml += '  <channel>\n';
    xml += `    <title>${escapeXml('Dredeco Plays — Portal de Games')}</title>\n`;
    xml += `    <link>${escapeXml(FRONTEND_URL)}</link>\n`;
    xml += `    <description>${escapeXml('Notícias, reviews, guias e listas sobre games')}</description>\n`;
    xml += `    <language>pt-BR</language>\n`;
    xml += `    <lastBuildDate>${escapeXml(toRfc822(lastBuild))}</lastBuildDate>\n`;
    xml += '    <image>\n';
    xml += `      <url>${escapeXml(SITE_LOGO_URL)}</url>\n`;
    xml += `      <title>${escapeXml('Dredeco Plays — Portal de Games')}</title>\n`;
    xml += `      <link>${escapeXml(FRONTEND_URL)}</link>\n`;
    xml += '    </image>\n';

    for (const post of posts) {
      const link = `${FRONTEND_URL}/blog/${post.slug}`;
      const pubDate = toRfc822(post.created_at);
      const desc = rssDescription(post);
      const categoryName = post.category ? post.category.name : 'Geral';
      const authorName = post.author ? post.author.name : 'Dredeco Plays';
      const rawThumb = post.getDataValue('thumbnail');
      const thumb = rawThumb ? absoluteThumbnailUrl(rawThumb, req) : null;

      xml += '    <item>\n';
      xml += `      <title>${escapeXml(post.title)}</title>\n`;
      xml += `      <link>${escapeXml(link)}</link>\n`;
      xml += `      <description><![CDATA[${escapeCdata(desc)}]]></description>\n`;
      xml += `      <pubDate>${escapeXml(pubDate)}</pubDate>\n`;
      xml += `      <guid isPermaLink="true">${escapeXml(link)}</guid>\n`;
      xml += `      <category>${escapeXml(categoryName)}</category>\n`;
      xml += `      <author>${escapeXml(authorName)}</author>\n`;
      if (thumb) {
        xml += `      <media:content url="${escapeXml(thumb)}" medium="image" />\n`;
      }
      xml += '    </item>\n';
    }

    xml += '  </channel>\n';
    xml += '</rss>';

    res.set({
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800',
    });
    res.send(xml);
  } catch (err) {
    next(err);
  }
};

exports.postSeo = async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { slug: req.params.slug },
      include: postIncludes,
    });
    if (!post || post.status !== 'published') {
      return res.status(404).json({ error: 'Post não encontrado.' });
    }

    const description = buildMetaDescription(post);
    const link = `${FRONTEND_URL}/blog/${post.slug}`;
    const apiBase = getApiBaseUrl(req);
    const rawThumb = post.getDataValue('thumbnail');
    const imageUrl = rawThumb ? absoluteThumbnailUrl(rawThumb, req) : null;

    let imageWidth = 1200;
    let imageHeight = 630;
    const diskPath = resolveThumbnailDiskPath(rawThumb, apiBase);
    if (diskPath && fs.existsSync(diskPath)) {
      try {
        const meta = await sharp(diskPath).metadata();
        if (meta.width) imageWidth = meta.width;
        if (meta.height) imageHeight = meta.height;
        if (meta.width && meta.width < 1200) {
          console.warn(`[seo] Imagem do post "${post.slug}" tem largura ${meta.width}px (< 1200px).`);
        }
      } catch (e) {
        // não quebra a response
      }
    }

    const authorSlug = slugifyAuthorPath(post.author && post.author.name);
    const tags = (post.tags || []).map((t) => t.name);

    const body = {
      title: post.title,
      description,
      slug: post.slug,
      url: link,
      canonicalUrl: link,
      publishedAt: post.created_at ? new Date(post.created_at).toISOString() : null,
      updatedAt: post.updated_at ? new Date(post.updated_at).toISOString() : null,
      author: {
        name: post.author ? post.author.name : 'Dredeco Plays',
        url: `${FRONTEND_URL}/autor/${authorSlug}`,
      },
      category: post.category
        ? { name: post.category.name, slug: post.category.slug }
        : { name: 'Geral', slug: 'geral' },
      image: imageUrl
        ? {
            url: imageUrl,
            width: imageWidth,
            height: imageHeight,
            alt: post.title,
          }
        : null,
      readingTime: readingTimeMinutes(plainWordCount(post.content)),
      tags,
    };

    res.set('Cache-Control', 'public, max-age=600');
    res.json(body);
  } catch (err) {
    next(err);
  }
};
