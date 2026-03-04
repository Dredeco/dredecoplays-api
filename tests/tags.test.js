const request = require('supertest');
const app = require('../src/app');
const { getAdminToken, createEditorAndGetToken, authHeaders } = require('./helpers');

describe('Tags API', () => {
  let adminToken;
  let editorToken;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    const editor = await createEditorAndGetToken(adminToken);
    editorToken = editor.token;
  });

  describe('GET /api/tags', () => {
    it('deve listar todas as tags', async () => {
      const res = await request(app).get('/api/tags');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach((tag) => {
        expect(tag).toHaveProperty('id');
        expect(tag).toHaveProperty('name');
        expect(tag).toHaveProperty('slug');
      });
    });
  });

  describe('POST /api/tags', () => {
    it('admin deve criar tag', async () => {
      const res = await request(app)
        .post('/api/tags')
        .set(authHeaders(adminToken))
        .send({ name: 'Tag Teste ' + Date.now() });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('slug');
    });

    it('deve retornar 401 sem token', async () => {
      const res = await request(app)
        .post('/api/tags')
        .send({ name: 'Teste' });
      expect(res.status).toBe(401);
    });

    it('deve retornar 422 sem nome', async () => {
      const res = await request(app)
        .post('/api/tags')
        .set(authHeaders(adminToken))
        .send({});
      expect(res.status).toBe(422);
    });

    it('editor deve ter acesso 403', async () => {
      const res = await request(app)
        .post('/api/tags')
        .set(authHeaders(editorToken))
        .send({ name: 'Tag Editor' });
      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/tags/:id', () => {
    it('admin deve atualizar tag', async () => {
      const createRes = await request(app)
        .post('/api/tags')
        .set(authHeaders(adminToken))
        .send({ name: 'Tag Para Update ' + Date.now() });
      const id = createRes.body.data.id;
      const novoNome = 'Tag Atualizada ' + Date.now();
      const res = await request(app)
        .put(`/api/tags/${id}`)
        .set(authHeaders(adminToken))
        .send({ name: novoNome });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe(novoNome);
      expect(res.body.data.slug).toMatch(/tag-atualizada/);
    });

    it('deve retornar 404 para id inexistente', async () => {
      const res = await request(app)
        .put('/api/tags/999999')
        .set(authHeaders(adminToken))
        .send({ name: 'X' });
      expect(res.status).toBe(404);
    });

    it('deve retornar 422 sem nome', async () => {
      const createRes = await request(app)
        .post('/api/tags')
        .set(authHeaders(adminToken))
        .send({ name: 'Tag 422 ' + Date.now() });
      const res = await request(app)
        .put(`/api/tags/${createRes.body.data.id}`)
        .set(authHeaders(adminToken))
        .send({});
      expect(res.status).toBe(422);
    });

    it('editor deve ter acesso 403', async () => {
      const createRes = await request(app)
        .post('/api/tags')
        .set(authHeaders(adminToken))
        .send({ name: 'Tag Editor Put ' + Date.now() });
      const res = await request(app)
        .put(`/api/tags/${createRes.body.data.id}`)
        .set(authHeaders(editorToken))
        .send({ name: 'Alterado' });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/tags/:id', () => {
    it('admin deve excluir tag', async () => {
      const createRes = await request(app)
        .post('/api/tags')
        .set(authHeaders(adminToken))
        .send({ name: 'Tag Para Excluir ' + Date.now() });
      const id = createRes.body.data.id;
      const res = await request(app)
        .delete(`/api/tags/${id}`)
        .set(authHeaders(adminToken));
      expect(res.status).toBe(204);
    });

    it('deve retornar 404 para id inexistente', async () => {
      const res = await request(app)
        .delete('/api/tags/999999')
        .set(authHeaders(adminToken));
      expect(res.status).toBe(404);
    });

    it('editor deve ter acesso 403', async () => {
      const createRes = await request(app)
        .post('/api/tags')
        .set(authHeaders(adminToken))
        .send({ name: 'Tag Editor Delete ' + Date.now() });
      const res = await request(app)
        .delete(`/api/tags/${createRes.body.data.id}`)
        .set(authHeaders(editorToken));
      expect(res.status).toBe(403);
    });
  });
});
