const request = require('supertest');
const app = require('../src/app');
const { getAdminToken, authHeaders } = require('./helpers');

describe('Auth API', () => {
  describe('POST /api/auth/login', () => {
    it('deve retornar token e user com credenciais válidas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@gamerzone.com.br', password: 'Admin@123' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('email');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('deve retornar 401 com senha incorreta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@gamerzone.com.br', password: 'senhaerrada' });
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('deve retornar 401 com email inexistente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'naoexiste@test.com', password: 'qualquer' });
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('deve retornar 422 sem email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'Admin@123' });
      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('details');
    });

    it('deve retornar 422 com email inválido', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'invalido', password: 'Admin@123' });
      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('details');
    });

    it('deve retornar 422 sem senha', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@gamerzone.com.br' });
      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('details');
    });
  });

  describe('GET /api/auth/me', () => {
    it('deve retornar usuário autenticado com token válido', async () => {
      const token = await getAdminToken();
      const res = await request(app)
        .get('/api/auth/me')
        .set(authHeaders(token));
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('admin@gamerzone.com.br');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('deve retornar 401 sem token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('deve retornar 401 com token inválido', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set(authHeaders('token-invalido'));
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });
});
