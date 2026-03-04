/**
 * Executa manualmente a migration 20240007 (images-to-base64).
 * Converte posts.thumbnail, products.image e users.avatar de VARCHAR(255) para MEDIUMTEXT.
 *
 * Uso: node scripts/run-migration-images-manual.js
 */
require('dotenv').config();
const { Sequelize } = require('sequelize');

const config = require('../src/config/database');
const env = process.env.NODE_ENV || 'development';
const dbCfg = config[env];

const sequelize = new Sequelize(dbCfg.database, dbCfg.username, dbCfg.password, {
  host: dbCfg.host,
  port: dbCfg.port || 3306,
  dialect: 'mysql',
  logging: console.log,
});

async function run() {
  console.log('\nExecutando migration manual: 20240007-images-to-base64\n');

  const queryInterface = sequelize.getQueryInterface();

  try {
    await queryInterface.changeColumn('posts', 'thumbnail', {
      type: Sequelize.TEXT('medium'),
      allowNull: true,
    });
    console.log('  posts.thumbnail -> MEDIUMTEXT OK');
  } catch (err) {
    if (err.message?.includes('Unknown column') || err.message?.includes("doesn't exist")) {
      console.log('  posts.thumbnail: coluna não existe ou já alterada, pulando.');
    } else {
      throw err;
    }
  }

  try {
    await queryInterface.changeColumn('products', 'image', {
      type: Sequelize.TEXT('medium'),
      allowNull: true,
    });
    console.log('  products.image -> MEDIUMTEXT OK');
  } catch (err) {
    if (err.message?.includes('Unknown column') || err.message?.includes("doesn't exist")) {
      console.log('  products.image: coluna não existe ou já alterada, pulando.');
    } else {
      throw err;
    }
  }

  try {
    await queryInterface.changeColumn('users', 'avatar', {
      type: Sequelize.TEXT('medium'),
      allowNull: true,
    });
    console.log('  users.avatar -> MEDIUMTEXT OK');
  } catch (err) {
    if (err.message?.includes('Unknown column') || err.message?.includes("doesn't exist")) {
      console.log('  users.avatar: coluna não existe ou já alterada, pulando.');
    } else {
      throw err;
    }
  }

  console.log('\nMigration concluída.\n');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nErro:', err.message);
    process.exit(1);
  })
  .finally(() => sequelize.close());
