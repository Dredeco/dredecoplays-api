require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { sequelize, Post } = require('../src/models');

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || 'public/uploads');

function extractFilenameFromThumbnail(thumbnail) {
  if (!thumbnail || typeof thumbnail !== 'string') return null;
  // thumbnail pode ser: /uploads/123-456.jpg ou https://host/uploads/123-456.jpg
  const match = thumbnail.match(/\/uploads\/([^/?]+)/);
  return match ? match[1] : null;
}

async function verifyThumbnails() {
  console.log('=== Diagnóstico de Thumbnails ===\n');
  console.log('Diretório de uploads:', UPLOAD_DIR);
  console.log('');

  try {
    await sequelize.authenticate();
  } catch (err) {
    console.error('Erro ao conectar ao banco:', err.message);
    process.exit(1);
  }

  const posts = await Post.findAll({
    attributes: ['id', 'title', 'thumbnail', 'slug'],
    raw: true,
  });

  const withoutThumbnail = [];
  const missingFile = [];
  const ok = [];

  for (const post of posts) {
    if (!post.thumbnail || post.thumbnail.trim() === '') {
      withoutThumbnail.push(post);
      continue;
    }

    const filename = extractFilenameFromThumbnail(post.thumbnail);
    if (!filename) {
      missingFile.push({ ...post, reason: 'URL/caminho inválido' });
      continue;
    }

    const filePath = path.join(UPLOAD_DIR, filename);
    if (!fs.existsSync(filePath)) {
      missingFile.push({ ...post, reason: 'Arquivo não encontrado', expectedPath: filePath });
      continue;
    }

    ok.push(post);
  }

  // Relatório
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

  console.log('\n--- Posts OK (thumbnail presente e arquivo existe) ---');
  if (ok.length === 0) {
    console.log('Nenhum.');
  } else {
    ok.forEach((p) => console.log(`  [${p.id}] ${p.title}`));
  }

  console.log('\n=== Resumo ===');
  console.log(`Total de posts: ${posts.length}`);
  console.log(`Sem thumbnail: ${withoutThumbnail.length}`);
  console.log(`Arquivo ausente: ${missingFile.length}`);
  console.log(`OK: ${ok.length}`);

  await sequelize.close();
  const hasProblems = missingFile.length > 0 || (posts.length > 0 && withoutThumbnail.length === posts.length);
  process.exit(hasProblems ? 1 : 0);
}

verifyThumbnails().catch((err) => {
  console.error(err);
  process.exit(1);
});
