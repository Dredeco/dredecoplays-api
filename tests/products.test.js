const request = require('supertest');
const app = require('../src/app');
const { getAdminToken, createEditorAndGetToken, authHeaders } = require('./helpers');

describe('Products API', () => {
  let adminToken;
  let editorToken;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    const editor = await createEditorAndGetToken(adminToken);
    editorToken = editor.token;
  });

  describe('GET /api/products', () => {
    it('deve listar produtos ativos', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach((p) => {
        expect(p).toHaveProperty('id');
        expect(p).toHaveProperty('name');
        expect(p.active).toBe(true);
      });
    });

    it('não deve listar produtos inativos sem auth', async () => {
      const createRes = await request(app)
        .post('/api/products')
        .set(authHeaders(adminToken))
        .send({
          name: 'Produto Inativo ' + Date.now(),
          price: 1,
          affiliate_url: 'https://example.com/inativo',
        });
      const id = createRes.body.data.id;
      await request(app)
        .put(`/api/products/${id}`)
        .set(authHeaders(adminToken))
        .send({ active: false });
      const res = await request(app).get('/api/products');
      const found = res.body.data.find((p) => p.id === id);
      expect(found).toBeUndefined();
    });

    it('admin com active=false deve ver produtos inativos', async () => {
      const createRes = await request(app)
        .post('/api/products')
        .set(authHeaders(adminToken))
        .send({
          name: 'Produto Inativo Admin ' + Date.now(),
          price: 1,
          affiliate_url: 'https://example.com/inativo-admin',
        });
      const id = createRes.body.data.id;
      await request(app)
        .put(`/api/products/${id}`)
        .set(authHeaders(adminToken))
        .send({ active: false });
      const res = await request(app)
        .get('/api/products')
        .set(authHeaders(adminToken))
        .query({ active: 'false' });
      const found = res.body.data.find((p) => p.id === id);
      expect(found).toBeDefined();
      expect(found.active).toBe(false);
    });
  });

  describe('POST /api/products', () => {
    it('admin deve criar produto', async () => {
      const res = await request(app)
        .post('/api/products')
        .set(authHeaders(adminToken))
        .send({
          name: 'Produto Teste ' + Date.now(),
          price: 99.9,
          affiliate_url: 'https://example.com/produto',
        });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('price');
    });

    it('deve retornar 401 sem token', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({
          name: 'Produto',
          price: 10,
          affiliate_url: 'https://example.com',
        });
      expect(res.status).toBe(401);
    });

    it('deve retornar 422 sem nome', async () => {
      const res = await request(app)
        .post('/api/products')
        .set(authHeaders(adminToken))
        .send({ price: 10, affiliate_url: 'https://example.com' });
      expect(res.status).toBe(422);
    });

    it('deve retornar 422 com preço inválido', async () => {
      const res = await request(app)
        .post('/api/products')
        .set(authHeaders(adminToken))
        .send({
          name: 'Produto',
          price: -5,
          affiliate_url: 'https://example.com',
        });
      expect(res.status).toBe(422);
    });

    it('deve retornar 422 com affiliate_url inválida', async () => {
      const res = await request(app)
        .post('/api/products')
        .set(authHeaders(adminToken))
        .send({
          name: 'Produto',
          price: 10,
          affiliate_url: 'nao-e-url',
        });
      expect(res.status).toBe(422);
    });

    it('editor deve ter acesso 403', async () => {
      const res = await request(app)
        .post('/api/products')
        .set(authHeaders(editorToken))
        .send({
          name: 'Produto',
          price: 10,
          affiliate_url: 'https://example.com',
        });
      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('admin deve atualizar produto', async () => {
      const listRes = await request(app).get('/api/products');
      const products = listRes.body.data;
      if (products.length === 0) return;
      const id = products[0].id;
      const res = await request(app)
        .put(`/api/products/${id}`)
        .set(authHeaders(adminToken))
        .send({ name: 'Nome Atualizado', price: 149.9 });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Nome Atualizado');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const res = await request(app)
        .put('/api/products/999999')
        .set(authHeaders(adminToken))
        .send({ name: 'X', price: 10 });
      expect(res.status).toBe(404);
    });

    it('admin deve desativar produto via active=false', async () => {
      const createRes = await request(app)
        .post('/api/products')
        .set(authHeaders(adminToken))
        .send({
          name: 'Produto Desativar ' + Date.now(),
          price: 1,
          affiliate_url: 'https://example.com/desativar',
        });
      const id = createRes.body.data.id;
      const res = await request(app)
        .put(`/api/products/${id}`)
        .set(authHeaders(adminToken))
        .send({ active: false });
      expect(res.status).toBe(200);
      expect(res.body.data.active).toBe(false);
    });

    it('editor deve ter acesso 403', async () => {
      const createRes = await request(app)
        .post('/api/products')
        .set(authHeaders(adminToken))
        .send({
          name: 'Produto Editor Put ' + Date.now(),
          price: 1,
          affiliate_url: 'https://example.com/editor',
        });
      const res = await request(app)
        .put(`/api/products/${createRes.body.data.id}`)
        .set(authHeaders(editorToken))
        .send({ name: 'Alterado' });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('admin deve excluir produto', async () => {
      const createRes = await request(app)
        .post('/api/products')
        .set(authHeaders(adminToken))
        .send({
          name: 'Produto Para Excluir ' + Date.now(),
          price: 1,
          affiliate_url: 'https://example.com/del',
        });
      const id = createRes.body.data.id;
      const res = await request(app)
        .delete(`/api/products/${id}`)
        .set(authHeaders(adminToken));
      expect(res.status).toBe(204);
    });

    it('editor deve ter acesso 403', async () => {
      const createRes = await request(app)
        .post('/api/products')
        .set(authHeaders(adminToken))
        .send({
          name: 'Produto Editor Delete ' + Date.now(),
          price: 1,
          affiliate_url: 'https://example.com/del-editor',
        });
      const res = await request(app)
        .delete(`/api/products/${createRes.body.data.id}`)
        .set(authHeaders(editorToken));
      expect(res.status).toBe(403);
    });
  });
});
