/**
 * Teste end-to-end do fluxo de upload de imagens.
 * Executa: login → upload → verifica resposta → busca post → verifica thumbnail
 *
 * Uso: node scripts/test-upload.js
 */
require('dotenv').config();
const sharp = require('sharp');

const API = `http://localhost:${process.env.PORT || 3001}`;

function log(label, value) {
  if (typeof value === 'string' && value.length > 120) {
    console.log(`  ${label}: ${value.slice(0, 80)}... [${value.length} chars]`);
  } else {
    console.log(`  ${label}:`, value);
  }
}

async function createTestImageBuffer() {
  return sharp({
    create: {
      width: 100,
      height: 100,
      channels: 3,
      background: { r: 99, g: 102, b: 241 },
    },
  })
    .png()
    .toBuffer();
}

async function run() {
  console.log(`\n🔌 Testando API em ${API}\n`);

  // ── 1. Health check ─────────────────────────────────────────────
  console.log('1. Health check...');
  const health = await fetch(`${API}/api/health`).then((r) => r.json());
  log('status', health.status);

  // ── 2. Login ────────────────────────────────────────────────────
  console.log('\n2. Login...');
  const loginRes = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gamerzone.com.br', password: 'Admin@123' }),
  });
  if (!loginRes.ok) {
    const err = await loginRes.json().catch(() => ({}));
    console.error('  ❌ Login falhou:', loginRes.status, err);
    process.exit(1);
  }
  const { token } = await loginRes.json();
  log('token', token ? `${token.slice(0, 30)}...` : 'AUSENTE');
  if (!token) process.exit(1);

  // ── 3. Upload da imagem ─────────────────────────────────────────
  console.log('\n3. Upload de imagem (PNG 100x100 gerado com Sharp)...');
  const imgBuf = await createTestImageBuffer();
  console.log(`  Imagem gerada: ${imgBuf.length} bytes`);

  const form = new FormData();
  form.append('image', new Blob([imgBuf], { type: 'image/png' }), 'test.png');

  const uploadRes = await fetch(`${API}/api/upload/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const uploadJson = await uploadRes.json().catch(() => ({}));

  log('HTTP status', uploadRes.status);
  if (!uploadRes.ok) {
    console.error('  ❌ Upload falhou:', uploadJson);
    process.exit(1);
  }

  const { data } = uploadJson;
  log('url (tipo)', data?.url?.startsWith('data:') ? 'data URI ✅' : data?.url || 'AUSENTE ❌');
  log('url length', data?.url?.length ?? 0);
  log('mimetype', data?.mimetype);
  log('size (bytes)', data?.size);
  log('path', data?.path);

  if (!data?.url?.startsWith('data:image/webp;base64,')) {
    console.error('\n  ❌ URL retornada não é um data URI WebP válido');
    process.exit(1);
  }

  // Validar que o base64 é decodificável e tamanho confere
  const b64part = data.url.split(',')[1];
  const decoded = Buffer.from(b64part, 'base64');
  if (decoded.length !== data.size) {
    console.error(`  ❌ Tamanho decodificado (${decoded.length}) != size reportado (${data.size})`);
    process.exit(1);
  }
  // Verificar magic bytes WebP: "RIFF....WEBP"
  const isWebP =
    decoded[0] === 0x52 && decoded[1] === 0x49 &&
    decoded[2] === 0x46 && decoded[3] === 0x46 &&
    decoded[8] === 0x57 && decoded[9] === 0x45 &&
    decoded[10] === 0x42 && decoded[11] === 0x50;
  if (!isWebP) {
    console.error('  ❌ Bytes decodificados não são um WebP válido (magic bytes incorretos)');
    process.exit(1);
  }
  console.log(`  ✅ Upload OK — WebP válido, ${decoded.length} bytes, base64 íntegro`);

  // ── 4. Verificar coluna do banco ────────────────────────────────
  console.log('\n4. Verificando tipo da coluna posts.thumbnail no banco...');
  const { Sequelize } = require('sequelize');
  const config = require('../src/config/database');
  const env = process.env.NODE_ENV || 'development';
  const dbCfg = config[env];
  const seq = new Sequelize(dbCfg.database, dbCfg.username, dbCfg.password, { ...dbCfg, logging: false });
  const [rows] = await seq.query("DESCRIBE posts");
  const thumbCol = rows.find((r) => r.Field === 'thumbnail');
  log('thumbnail column type', thumbCol?.Type || 'não encontrado');
  if (!thumbCol?.Type?.toLowerCase().includes('text')) {
    console.error('  ❌ Coluna não é TEXT — execute: npm run migrate');
  } else {
    console.log('  ✅ Coluna é TEXT — OK para armazenar base64');
  }
  await seq.close();

  // ── 5. Buscar posts e checar thumbnails ─────────────────────────
  console.log('\n5. Buscando posts recentes e verificando thumbnails...');
  const postsRes = await fetch(`${API}/api/posts/recent`).then((r) => r.json());
  const posts = postsRes.data ?? postsRes ?? [];
  console.log(`  Total recentes: ${posts.length}`);
  for (const p of posts.slice(0, 5)) {
    const t = p.thumbnail;
    let status;
    if (!t) status = '— sem thumbnail';
    else if (t.startsWith('data:image/webp;base64,')) status = `✅ base64 WebP (${t.length} chars)`;
    else if (t.startsWith('data:')) status = `⚠️  data URI (mimetype desconhecido, ${t.length} chars)`;
    else if (t.length <= 255) status = `❌ TRUNCADO (${t.length} chars) — provavelmente VARCHAR(255)`;
    else status = `URL: ${t.slice(0, 60)}...`;
    console.log(`  [id=${p.id}] "${p.title?.slice(0, 40)}..." → ${status}`);
  }

  console.log('\n✅ Teste concluído.\n');
}

run().catch((err) => {
  console.error('\n❌ Erro inesperado:', err.message);
  process.exit(1);
});
