const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../src/app');

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || 'public/uploads');

async function getAdminToken() {
  const res = await request(app).post('/api/auth/login').send({
    email: 'admin@gamerzone.com.br',
    password: 'Admin@123',
  });
  if (res.status !== 200) throw new Error('Login falhou: ' + JSON.stringify(res.body));
  return res.body.token;
}

describe('Upload API - Thumbnails', () => {
  let adminToken;
  let uploadedFilename;

  beforeAll(async () => {
    adminToken = await getAdminToken();
  });

  describe('POST /api/upload/image', () => {
    it('deve retornar url válida e salvar arquivo em disco', async () => {
      const minimalPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64'
      );
      const res = await request(app)
        .post('/api/upload/image')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', minimalPng, 'pixel.png');
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('url');
      expect(res.body.data).toHaveProperty('filename');
      expect(res.body.data.url).toMatch(/\/uploads\/.+/);
      expect(typeof res.body.data.filename).toBe('string');
      expect(res.body.data.filename.length).toBeGreaterThan(0);
      uploadedFilename = res.body.data.filename;
      const filePath = path.join(UPLOAD_DIR, uploadedFilename);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('GET /uploads/:filename', () => {
    it('deve retornar 200 para arquivo existente', async () => {
      if (!uploadedFilename) {
        const minimalPng = Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
          'base64'
        );
        const uploadRes = await request(app)
          .post('/api/upload/image')
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('image', minimalPng, 'pixel.png');
        uploadedFilename = uploadRes.body.data.filename;
      }
      const res = await request(app).get(`/uploads/${uploadedFilename}`);
      expect(res.status).toBe(200);
    });
  });
});
