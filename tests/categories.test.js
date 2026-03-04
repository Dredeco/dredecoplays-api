const request = require('supertest');
const app = require('../src/app');
const { getAdminToken, createEditorAndGetToken, authHeaders } = require('./helpers');

describe('Categories API', () => {
  let adminToken;
  let editorToken;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    const editor = await createEditorAndGetToken(adminToken);
    editorToken = editor.token;
  });

  describe('GET /api/categories', () => {
    it('deve listar todas as categorias', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach((cat) => {
        expect(cat).toHaveProperty('id');
        expect(cat).toHaveProperty('name');
        expect(cat).toHaveProperty('slug');
      });
    });
  });

  describe('GET /api/categories/:slug/posts', () => {
    it('deve retornar posts da categoria', async () => {
      const res = await request(app).get('/api/categories/reviews/posts').query({ limit: 5 });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('category');
      expect(res.body).toHaveProperty('meta');
      expect(res.body.category.slug).toBe('reviews');
    });

    it('deve retornar 404 para slug inexistente', async () => {
      const res = await request(app).get('/api/categories/categoria-inexistente-xyz/posts');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

    it('deve suportar paginação', async () => {
      const page1 = await request(app).get('/api/categories/reviews/posts').query({ page: 1, limit: 1 });
      const page2 = await request(app).get('/api/categories/reviews/posts').query({ page: 2, limit: 1 });
      expect(page1.status).toBe(200);
      expect(page2.status).toBe(200);
      expect(page1.body.meta).toHaveProperty('totalPages');
      expect(page1.body.meta.page).toBe(1);
      expect(page2.body.meta.page).toBe(2);
      if (page1.body.meta.totalPages >= 2) {
        expect(page1.body.data[0]?.id).not.toBe(page2.body.data[0]?.id);
      }
    });
  });

  describe('POST /api/categories', () => {
    it('admin deve criar categoria', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set(authHeaders(adminToken))
        .send({ name: 'Categoria Teste ' + Date.now() });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('slug');
    });

    it('deve retornar 401 sem token', async () => {
      const res = await request(app)
        .post('/api/categories')
        .send({ name: 'Teste' });
      expect(res.status).toBe(401);
    });

    it('deve retornar 422 sem nome', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set(authHeaders(adminToken))
        .send({});
      expect(res.status).toBe(422);
    });

    it('editor deve ter acesso 403', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set(authHeaders(editorToken))
        .send({ name: 'Categoria Editor' });
      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('admin deve atualizar categoria', async () => {
      const listRes = await request(app).get('/api/categories');
      const cat = listRes.body.data[0];
      const res = await request(app)
        .put(`/api/categories/${cat.id}`)
        .set(authHeaders(adminToken))
        .send({ description: 'Descrição atualizada' });
      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Descrição atualizada');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const res = await request(app)
        .put('/api/categories/999999')
        .set(authHeaders(adminToken))
        .send({ description: 'X' });
      expect(res.status).toBe(404);
    });

    it('editor deve ter acesso 403', async () => {
      const listRes = await request(app).get('/api/categories');
      const cat = listRes.body.data[0];
      const res = await request(app)
        .put(`/api/categories/${cat.id}`)
        .set(authHeaders(editorToken))
        .send({ description: 'X' });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('admin deve excluir categoria', async () => {
      const createRes = await request(app)
        .post('/api/categories')
        .set(authHeaders(adminToken))
        .send({ name: 'Categoria Para Excluir ' + Date.now() });
      const id = createRes.body.data.id;
      const res = await request(app)
        .delete(`/api/categories/${id}`)
        .set(authHeaders(adminToken));
      expect(res.status).toBe(204);
    });

    it('editor deve ter acesso 403', async () => {
      const createRes = await request(app)
        .post('/api/categories')
        .set(authHeaders(adminToken))
        .send({ name: 'Categoria Editor Delete ' + Date.now() });
      const id = createRes.body.data.id;
      const res = await request(app)
        .delete(`/api/categories/${id}`)
        .set(authHeaders(editorToken));
      expect(res.status).toBe(403);
    });
  });
});
