const request = require('supertest');
const app = require('../src/app');

describe('Posts API - Thumbnails', () => {
  describe('GET /api/posts', () => {
    it('deve incluir o campo thumbnail em cada post da resposta', async () => {
      const res = await request(app).get('/api/posts').query({ limit: 10 });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach((post) => {
        expect(post).toHaveProperty('thumbnail');
      });
    });
  });

  describe('GET /api/posts/featured', () => {
    it('deve incluir o campo thumbnail no post em destaque', async () => {
      const res = await request(app).get('/api/posts/featured');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      if (res.body.data) {
        expect(res.body.data).toHaveProperty('thumbnail');
      }
    });
  });

  describe('GET /api/posts/recent', () => {
    it('deve incluir o campo thumbnail em cada post', async () => {
      const res = await request(app).get('/api/posts/recent');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach((post) => {
        expect(post).toHaveProperty('thumbnail');
      });
    });
  });

  describe('GET /api/posts/:slug', () => {
    it('deve incluir o campo thumbnail no post por slug', async () => {
      const listRes = await request(app).get('/api/posts/recent');
      const posts = listRes.body?.data || [];
      if (posts.length === 0) return;
      const slug = posts[0].slug;
      const res = await request(app).get(`/api/posts/${slug}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('thumbnail');
    });
  });
});
