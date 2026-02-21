require('dotenv').config();
const mysql2 = require('mysql2/promise');

async function createDatabase() {
  const conn = await mysql2.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
  });

  const db = process.env.DB_NAME || 'gamerzone_blog';
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log(`Banco de dados "${db}" criado (ou já existia).`);
  await conn.end();
}

createDatabase().catch((err) => {
  console.error('Erro ao criar banco:', err.message);
  process.exit(1);
});
