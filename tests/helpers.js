const request = require('supertest');
const app = require('../src/app');

const ADMIN = { email: 'admin@gamerzone.com.br', password: 'Admin@123' };

async function getAdminToken() {
  const res = await request(app)
    .post('/api/auth/login')
    .send(ADMIN);
  if (res.status !== 200) throw new Error('Login admin falhou: ' + JSON.stringify(res.body));
  return res.body.token;
}

async function createEditorAndGetToken(adminToken) {
  const editorRes = await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Editor Teste',
      email: `editor-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@test.com`,
      password: 'Editor@123',
      role: 'editor',
    });
  if (editorRes.status !== 201) throw new Error('Criar editor falhou: ' + JSON.stringify(editorRes.body));
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: editorRes.body.data.email, password: 'Editor@123' });
  if (loginRes.status !== 200) throw new Error('Login editor falhou');
  return { token: loginRes.body.token, userId: editorRes.body.data.id };
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

const minimalPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

module.exports = { getAdminToken, createEditorAndGetToken, authHeaders, minimalPng, ADMIN };
