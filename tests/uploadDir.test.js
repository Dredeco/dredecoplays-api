const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  resolveUploadDir,
  filenameFromUploadsUrl,
  thumbnailDiskPath,
} = require('../src/config/uploadDir');

describe('uploadDir config', () => {
  const originalEnv = { ...process.env };
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dredeco-uploads-'));
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv.NODE_ENV;
    if (originalEnv.UPLOAD_DIR === undefined) {
      delete process.env.UPLOAD_DIR;
    } else {
      process.env.UPLOAD_DIR = originalEnv.UPLOAD_DIR;
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('resolveUploadDir', () => {
    it('cria a pasta e devolve absoluto quando UPLOAD_DIR aponta para tmp', () => {
      process.env.NODE_ENV = 'test';
      process.env.UPLOAD_DIR = tempDir;
      const resolved = resolveUploadDir();
      expect(resolved).toBe(path.resolve(tempDir));
      expect(fs.existsSync(resolved)).toBe(true);
    });

    it('em produção recusa path dentro da pasta do app', () => {
      process.env.NODE_ENV = 'production';
      process.env.UPLOAD_DIR = 'public/uploads';
      expect(() => resolveUploadDir()).toThrow(/dentro da pasta do app/i);
    });
  });

  describe('filenameFromUploadsUrl', () => {
    it('aceita path relativo /uploads/...', () => {
      expect(filenameFromUploadsUrl('/uploads/123-456.webp')).toBe('123-456.webp');
    });

    it('aceita URL absoluta', () => {
      expect(
        filenameFromUploadsUrl('https://api.dredecoplays.com.br/uploads/abc.jpg'),
      ).toBe('abc.jpg');
    });

    it('recusa vazio, traversal e subpasta', () => {
      expect(filenameFromUploadsUrl('')).toBeNull();
      expect(filenameFromUploadsUrl(null)).toBeNull();
      expect(filenameFromUploadsUrl('/uploads/../secret')).toBeNull();
      expect(filenameFromUploadsUrl('/uploads/a/b.webp')).toBeNull();
      expect(filenameFromUploadsUrl('/other/file.webp')).toBeNull();
    });
  });

  describe('thumbnailDiskPath', () => {
    it('fica dentro do diretório resolvido', () => {
      process.env.NODE_ENV = 'test';
      process.env.UPLOAD_DIR = tempDir;
      const disk = thumbnailDiskPath('/uploads/foto.webp');
      expect(disk).toBe(path.join(tempDir, 'foto.webp'));
      const relative = path.relative(tempDir, disk);
      expect(relative.startsWith('..')).toBe(false);
      expect(path.isAbsolute(relative)).toBe(false);
    });

    it('retorna null para valor inválido', () => {
      process.env.NODE_ENV = 'test';
      process.env.UPLOAD_DIR = tempDir;
      expect(thumbnailDiskPath('/uploads/../x')).toBeNull();
    });
  });
});
