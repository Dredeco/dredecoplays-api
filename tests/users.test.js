const request = require('supertest');
const app = require('../src/app');
const { getAdminToken, createEditorAndGetToken, authHeaders } = require('./helpers');

describe('Users API', () => {
  let adminToken;
  let editorUserId;
  let editorToken;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    const editor = await createEditorAndGetToken(adminToken);
    editorToken = editor.token;
    editorUserId = editor.userId;
  });

  describe('GET /api/users', () => {
    it('admin deve listar usuários', async () => {
      const res = await request(app)
        .get('/api/users')
        .set(authHeaders(adminToken));
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach((u) => expect(u).not.toHaveProperty('password'));
    });

    it('deve retornar 401 sem token', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
    });

    it('editor deve ter acesso 403', async () => {
      const res = await request(app)
        .get('/api/users')
        .set(authHeaders(editorToken));
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/users/:id', () => {
    it('admin deve obter usuário por id', async () => {
      const listRes = await request(app)
        .get('/api/users')
        .set(authHeaders(adminToken));
      const users = listRes.body.data;
      if (users.length === 0) return;
      const id = users[0].id;
      const res = await request(app)
        .get(`/api/users/${id}`)
        .set(authHeaders(adminToken));
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const res = await request(app)
        .get('/api/users/999999')
        .set(authHeaders(adminToken));
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/users', () => {
    it('admin deve criar usuário', async () => {
      const res = await request(app)
        .post('/api/users')
        .set(authHeaders(adminToken))
        .send({
          name: 'Novo User ' + Date.now(),
          email: `user-${Date.now()}@test.com`,
          password: 'Senha123!',
        });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('email');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('deve retornar 422 sem nome', async () => {
      const res = await request(app)
        .post('/api/users')
        .set(authHeaders(adminToken))
        .send({ email: 'a@b.com', password: '123456' });
      expect(res.status).toBe(422);
    });

    it('deve retornar 422 com email inválido', async () => {
      const res = await request(app)
        .post('/api/users')
        .set(authHeaders(adminToken))
        .send({ name: 'User', email: 'invalido', password: '123456' });
      expect(res.status).toBe(422);
    });

    it('deve retornar 422 com senha curta', async () => {
      const res = await request(app)
        .post('/api/users')
        .set(authHeaders(adminToken))
        .send({ name: 'User', email: 'a@b.com', password: '12345' });
      expect(res.status).toBe(422);
    });

    it('deve retornar 409 ao criar usuário com email duplicado', async () => {
      const email = `dup-${Date.now()}@test.com`;
      await request(app)
        .post('/api/users')
        .set(authHeaders(adminToken))
        .send({ name: 'User 1', email, password: '123456' });
      const res = await request(app)
        .post('/api/users')
        .set(authHeaders(adminToken))
        .send({ name: 'User 2', email, password: '123456' });
      expect(res.status).toBe(409);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('admin deve atualizar usuário', async () => {
      const res = await request(app)
        .put(`/api/users/${editorUserId}`)
        .set(authHeaders(adminToken))
        .send({ name: 'Editor Atualizado' });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Editor Atualizado');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('admin não pode excluir a própria conta', async () => {
      const meRes = await request(app)
        .get('/api/auth/me')
        .set(authHeaders(adminToken));
      const adminId = meRes.body.user.id;
      const res = await request(app)
        .delete(`/api/users/${adminId}`)
        .set(authHeaders(adminToken));
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('própria');
    });

    it('admin deve excluir outro usuário', async () => {
      const createRes = await request(app)
        .post('/api/users')
        .set(authHeaders(adminToken))
        .send({
          name: 'User Para Excluir',
          email: `del-${Date.now()}@test.com`,
          password: '123456',
        });
      const id = createRes.body.data.id;
      const res = await request(app)
        .delete(`/api/users/${id}`)
        .set(authHeaders(adminToken));
      expect(res.status).toBe(204);
    });
  });
});
