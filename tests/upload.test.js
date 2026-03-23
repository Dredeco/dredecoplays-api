const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../src/app');
const { getAdminToken, createEditorAndGetToken, authHeaders, minimalPng } = require('./helpers');

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || 'public/uploads');

describe('Upload API', () => {
  let adminToken;
  let editorToken;
  let uploadedFilename;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    const editor = await createEditorAndGetToken(adminToken);
    editorToken = editor.token;
  });

  describe('POST /api/upload/image', () => {
    it('admin deve fazer upload e receber url válida', async () => {
      const res = await request(app)
        .post('/api/upload/image')
        .set(authHeaders(adminToken))
        .attach('image', minimalPng, 'pixel.png');
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('url');
      expect(res.body.data).toHaveProperty('webpUrl');
      expect(res.body.data).toHaveProperty('width');
      expect(res.body.data).toHaveProperty('height');
      expect(res.body.data.url).toMatch(/\/uploads\/.+/);
      expect(res.body.data.webpUrl).toMatch(/\/uploads\/.+\.webp$/);
      uploadedFilename = path.basename(res.body.data.url);
      const filePath = path.join(UPLOAD_DIR, uploadedFilename);
      expect(fs.existsSync(filePath)).toBe(true);
      const webpName = path.basename(res.body.data.webpUrl);
      expect(fs.existsSync(path.join(UPLOAD_DIR, webpName))).toBe(true);
    });

    it('deve retornar 401 sem token', async () => {
      const res = await request(app)
        .post('/api/upload/image')
        .attach('image', minimalPng, 'pixel.png');
      expect(res.status).toBe(401);
    });

    it('editor deve ter acesso 403', async () => {
      const res = await request(app)
        .post('/api/upload/image')
        .set(authHeaders(editorToken))
        .attach('image', minimalPng, 'pixel.png');
      expect(res.status).toBe(403);
    });

    it('deve retornar 400 sem arquivo', async () => {
      const res = await request(app)
        .post('/api/upload/image')
        .set(authHeaders(adminToken));
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('deve retornar 400 para tipo de arquivo inválido', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf content');
      const res = await request(app)
        .post('/api/upload/image')
        .set(authHeaders(adminToken))
        .attach('image', pdfBuffer, 'documento.pdf');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/não permitido|arquivo/i);
    });

    it('deve retornar 413 para arquivo acima do limite', async () => {
      const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;
      const bigBuffer = Buffer.alloc(maxSize + 1024);
      const res = await request(app)
        .post('/api/upload/image')
        .set(authHeaders(adminToken))
        .attach('image', bigBuffer, 'bigfile.png');
      expect(res.status).toBe(413);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /uploads/:filename', () => {
    it('deve servir arquivo estático com 200', async () => {
      if (!uploadedFilename) {
        const uploadRes = await request(app)
          .post('/api/upload/image')
          .set(authHeaders(adminToken))
          .attach('image', minimalPng, 'pixel.png');
        uploadedFilename = path.basename(uploadRes.body.data.url);
      }
      const res = await request(app).get(`/uploads/${uploadedFilename}`);
      expect(res.status).toBe(200);
    });
  });
});
