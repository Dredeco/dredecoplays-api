const request = require('supertest');
const app = require('../src/app');
const { getAdminToken, createEditorAndGetToken, authHeaders } = require('./helpers');

describe('Posts API', () => {
  let adminToken;
  let editorToken;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    const editor = await createEditorAndGetToken(adminToken);
    editorToken = editor.token;
  });

  describe('GET /api/posts', () => {
    it('deve listar posts publicados sem auth', async () => {
      const res = await request(app).get('/api/posts').query({ limit: 5 });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('page');
      expect(res.body.meta).toHaveProperty('totalPages');
      res.body.data.forEach((post) => {
        expect(post).toHaveProperty('thumbnail');
        expect(post.status).toBe('published');
      });
    });

    it('deve incluir campo thumbnail em cada post', async () => {
      const res = await request(app).get('/api/posts').query({ limit: 10 });
      expect(res.status).toBe(200);
      res.body.data.forEach((post) => expect(post).toHaveProperty('thumbnail'));
    });

    it('deve filtrar por categoria via query', async () => {
      const res = await request(app)
        .get('/api/posts')
        .query({ category: 'reviews', limit: 5 });
      expect(res.status).toBe(200);
      res.body.data.forEach((post) => {
        expect(post.category?.slug).toBe('reviews');
      });
    });

    it('admin deve poder ver drafts com status=draft', async () => {
      const res = await request(app)
        .get('/api/posts')
        .set(authHeaders(adminToken))
        .query({ status: 'draft', limit: 5 });
      expect(res.status).toBe(200);
    });

    it('deve filtrar por tag via query', async () => {
      const tagName = 'Tag Filtro Teste ' + Date.now();
      const tagRes = await request(app)
        .post('/api/tags')
        .set(authHeaders(adminToken))
        .send({ name: tagName });
      expect(tagRes.status).toBe(201);
      const tagId = tagRes.body.data.id;
      const tagSlug = tagRes.body.data.slug;
      await request(app)
        .post('/api/posts')
        .set(authHeaders(adminToken))
        .send({ title: 'Post com Tag ' + Date.now(), content: '<p>X</p>', status: 'published', tags: [tagId] });
      const res = await request(app).get('/api/posts').query({ tag: tagSlug, limit: 10 });
      expect(res.status).toBe(200);
      res.body.data.forEach((post) => {
        const slugs = (post.tags || []).map((t) => t.slug);
        expect(slugs).toContain(tagSlug);
      });
    });

    it('deve filtrar por search', async () => {
      const res = await request(app).get('/api/posts').query({ search: 'Elden', limit: 10 });
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(0);
      res.body.data.forEach((post) => {
        const matches = post.title.includes('Elden') || (post.excerpt && post.excerpt.includes('Elden'));
        expect(matches).toBe(true);
      });
    });
  });

  describe('GET /api/posts/featured', () => {
    it('deve retornar post em destaque', async () => {
      const res = await request(app).get('/api/posts/featured');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      if (res.body.data) {
        expect(res.body.data).toHaveProperty('thumbnail');
        expect(res.body.data.featured).toBe(true);
      }
    });
  });

  describe('GET /api/posts/popular', () => {
    it('deve retornar posts ordenados por views', async () => {
      const res = await request(app).get('/api/posts/popular').query({ limit: 3 });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach((post) => expect(post).toHaveProperty('thumbnail'));
    });
  });

  describe('GET /api/posts/recent', () => {
    it('deve retornar posts recentes', async () => {
      const res = await request(app).get('/api/posts/recent');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach((post) => expect(post).toHaveProperty('thumbnail'));
    });
  });

  describe('GET /api/posts/:slug', () => {
    it('deve retornar post por slug', async () => {
      const listRes = await request(app).get('/api/posts/recent');
      const posts = listRes.body?.data || [];
      if (posts.length === 0) return;
      const slug = posts[0].slug;
      const res = await request(app).get(`/api/posts/${slug}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('thumbnail');
      expect(res.body.data.slug).toBe(slug);
    });

    it('deve retornar 404 para slug inexistente', async () => {
      const res = await request(app).get('/api/posts/slug-inexistente-xyz-123');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

    it('draft deve retornar 404 sem auth', async () => {
      const createRes = await request(app)
        .post('/api/posts')
        .set(authHeaders(adminToken))
        .send({ title: 'Draft Oculto ' + Date.now(), content: '<p>Draft</p>', status: 'draft' });
      const slug = createRes.body.data.slug;
      const res = await request(app).get(`/api/posts/${slug}`);
      expect(res.status).toBe(404);
    });

    it('admin deve ver draft por slug', async () => {
      const createRes = await request(app)
        .post('/api/posts')
        .set(authHeaders(adminToken))
        .send({ title: 'Draft Admin ' + Date.now(), content: '<p>Draft</p>', status: 'draft' });
      const slug = createRes.body.data.slug;
      const res = await request(app).get(`/api/posts/${slug}`).set(authHeaders(adminToken));
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('draft');
    });

    it('deve incrementar views ao buscar post', async () => {
      const listRes = await request(app).get('/api/posts/recent');
      const posts = listRes.body?.data || [];
      if (posts.length === 0) return;
      const slug = posts[0].slug;
      const viewsBefore = posts[0].views ?? 0;
      await request(app).get(`/api/posts/${slug}`);
      const res = await request(app).get('/api/posts/recent');
      const found = res.body.data.find((p) => p.slug === slug);
      expect(found.views).toBe(viewsBefore + 1);
    });
  });

  describe('POST /api/posts', () => {
    it('admin deve criar post', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set(authHeaders(adminToken))
        .send({
          title: 'Post de Teste ' + Date.now(),
          content: '<p>Conteúdo do post</p>',
          status: 'draft',
        });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('title');
      expect(res.body.data).toHaveProperty('slug');
    });

    it('deve retornar 401 sem token', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({ title: 'Teste', content: '<p>Conteúdo</p>' });
      expect(res.status).toBe(401);
    });

    it('editor deve ter acesso 403', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set(authHeaders(editorToken))
        .send({ title: 'Teste', content: '<p>Conteúdo</p>' });
      expect(res.status).toBe(403);
    });

    it('deve retornar 422 sem título', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set(authHeaders(adminToken))
        .send({ content: '<p>Conteúdo</p>' });
      expect(res.status).toBe(422);
    });

    it('deve retornar 422 sem conteúdo', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set(authHeaders(adminToken))
        .send({ title: 'Título' });
      expect(res.status).toBe(422);
    });

    it('admin deve criar post com tags associadas', async () => {
      const tagRes = await request(app)
        .post('/api/tags')
        .set(authHeaders(adminToken))
        .send({ name: 'Tag Post ' + Date.now() });
      const tagId = tagRes.body.data.id;
      const res = await request(app)
        .post('/api/posts')
        .set(authHeaders(adminToken))
        .send({ title: 'Post com Tags ' + Date.now(), content: '<p>Conteúdo</p>', status: 'published', tags: [tagId] });
      expect(res.status).toBe(201);
      expect(res.body.data.tags).toBeDefined();
      expect(res.body.data.tags.some((t) => t.id === tagId)).toBe(true);
    });

    it('deve retornar 409 ao criar post com slug duplicado', async () => {
      const title = 'Slug Duplicado Unico ' + Date.now();
      await request(app)
        .post('/api/posts')
        .set(authHeaders(adminToken))
        .send({ title, content: '<p>Primeiro</p>', status: 'draft' });
      const res = await request(app)
        .post('/api/posts')
        .set(authHeaders(adminToken))
        .send({ title, content: '<p>Segundo</p>', status: 'draft' });
      expect(res.status).toBe(409);
    });
  });

  describe('PUT /api/posts/:id', () => {
    it('admin deve atualizar post', async () => {
      const createRes = await request(app)
        .post('/api/posts')
        .set(authHeaders(adminToken))
        .send({ title: 'Post para Update ' + Date.now(), content: '<p>Inicial</p>', status: 'draft' });
      const id = createRes.body.data.id;
      const res = await request(app)
        .put(`/api/posts/${id}`)
        .set(authHeaders(adminToken))
        .send({ content: '<p>Conteúdo atualizado</p>' });
      expect(res.status).toBe(200);
      expect(res.body.data.content).toContain('atualizado');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const res = await request(app)
        .put('/api/posts/999999')
        .set(authHeaders(adminToken))
        .send({ content: '<p>X</p>' });
      expect(res.status).toBe(404);
    });

    it('admin deve atualizar título e regerar slug', async () => {
      const createRes = await request(app)
        .post('/api/posts')
        .set(authHeaders(adminToken))
        .send({ title: 'Titulo Original ' + Date.now(), content: '<p>Inicial</p>', status: 'draft' });
      const id = createRes.body.data.id;
      const slugAntigo = createRes.body.data.slug;
      const novoTitle = 'Titulo Alterado Novo ' + Date.now();
      const res = await request(app)
        .put(`/api/posts/${id}`)
        .set(authHeaders(adminToken))
        .send({ title: novoTitle });
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe(novoTitle);
      expect(res.body.data.slug).not.toBe(slugAntigo);
      expect(res.body.data.slug).toMatch(/titulo-alterado-novo/);
    });

    it('editor deve ter acesso 403', async () => {
      const createRes = await request(app)
        .post('/api/posts')
        .set(authHeaders(adminToken))
        .send({ title: 'Post Editor 403 ' + Date.now(), content: '<p>X</p>', status: 'draft' });
      const id = createRes.body.data.id;
      const putRes = await request(app)
        .put(`/api/posts/${id}`)
        .set(authHeaders(editorToken))
        .send({ content: '<p>Alterado</p>' });
      expect(putRes.status).toBe(403);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('admin deve excluir post', async () => {
      const createRes = await request(app)
        .post('/api/posts')
        .set(authHeaders(adminToken))
        .send({ title: 'Post para Delete ' + Date.now(), content: '<p>Será excluído</p>', status: 'draft' });
      const id = createRes.body.data.id;
      const res = await request(app).delete(`/api/posts/${id}`).set(authHeaders(adminToken));
      expect(res.status).toBe(204);
    });

    it('editor deve ter acesso 403', async () => {
      const createRes = await request(app)
        .post('/api/posts')
        .set(authHeaders(adminToken))
        .send({ title: 'Post Editor Delete 403 ' + Date.now(), content: '<p>X</p>', status: 'draft' });
      const id = createRes.body.data.id;
      const res = await request(app).delete(`/api/posts/${id}`).set(authHeaders(editorToken));
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/posts/:id/publish', () => {
    it('admin deve alterar status publicado/draft', async () => {
      const createRes = await request(app)
        .post('/api/posts')
        .set(authHeaders(adminToken))
        .send({ title: 'Post Publish ' + Date.now(), content: '<p>Teste</p>', status: 'draft' });
      const id = createRes.body.data.id;
      const res = await request(app).patch(`/api/posts/${id}/publish`).set(authHeaders(adminToken));
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('status');
      expect(['published', 'draft']).toContain(res.body.data.status);
    });

    it('editor deve ter acesso 403', async () => {
      const createRes = await request(app)
        .post('/api/posts')
        .set(authHeaders(adminToken))
        .send({ title: 'Post Editor Publish 403 ' + Date.now(), content: '<p>X</p>', status: 'draft' });
      const id = createRes.body.data.id;
      const res = await request(app).patch(`/api/posts/${id}/publish`).set(authHeaders(editorToken));
      expect(res.status).toBe(403);
    });
  });
});
