const request = require('supertest');
const app = require('../src/app');

describe('Health e rotas auxiliares', () => {
  it('GET /api/health deve retornar status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', timestamp: expect.any(String) });
  });

  it('GET /api/rota-inexistente deve retornar 404', async () => {
    const res = await request(app).get('/api/rota-inexistente');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('encontrada');
  });

  it('GET /api/posts/:slug deve retornar 404 para slug inexistente', async () => {
    const res = await request(app).get('/api/posts/slug-que-nao-existe-12345');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
