const request = require('supertest');
const app = require('../src/app');
const { getAdminToken, createEditorAndGetToken, authHeaders, minimalPng } = require('./helpers');

describe('Upload API', () => {
  let adminToken;
  let editorToken;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    const editor = await createEditorAndGetToken(adminToken);
    editorToken = editor.token;
  });

  describe('POST /api/upload/image', () => {
    it('admin deve fazer upload e receber base64 válido', async () => {
      const res = await request(app)
        .post('/api/upload/image')
        .set(authHeaders(adminToken))
        .attach('image', minimalPng, 'pixel.png');
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('url');
      expect(res.body.data).toHaveProperty('size');
      expect(res.body.data).toHaveProperty('mimetype');
      expect(res.body.data.url).toMatch(/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/);
      expect(res.body.data.mimetype).toBe('image/webp');
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
});
