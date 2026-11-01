const fs = require('fs');
const path = require('path');

const DEFAULT_RELATIVE = 'public/uploads';

/**
 * Diretório absoluto onde as imagens ficam em disco.
 * Em produção, path dentro de process.cwd() impede o boot (deploy apaga essa pasta).
 */
function resolveUploadDir() {
  const raw = process.env.UPLOAD_DIR;
  const resolved = path.resolve(
    raw && String(raw).trim() ? String(raw).trim() : DEFAULT_RELATIVE,
  );

  if (process.env.NODE_ENV === 'production') {
    const relativeToCwd = path.relative(process.cwd(), resolved);
    const insideApp =
      relativeToCwd === '' ||
      (!relativeToCwd.startsWith('..') && !path.isAbsolute(relativeToCwd));
    if (insideApp) {
      throw new Error(
        `UPLOAD_DIR="${resolved}" está dentro da pasta do app. Em produção use um caminho absoluto fora do application root (ex.: /home/<usuario>/persistent/dredecoplays-uploads). Deploy substitui a pasta do app e apaga as imagens.`,
      );
    }
  }

  fs.mkdirSync(resolved, { recursive: true });
  return resolved;
}

/**
 * Extrai só o nome do arquivo a partir de /uploads/... ou URL absoluta.
 * Recusa vazio, ., .. e qualquer subpasta.
 * @param {unknown} value
 * @returns {string|null}
 */
function filenameFromUploadsUrl(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  let pathname = trimmed;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      pathname = new URL(trimmed).pathname;
    } catch {
      return null;
    }
  }

  if (!pathname.startsWith('/uploads/')) return null;
  const rest = pathname.slice('/uploads/'.length);
  if (!rest || rest.includes('/') || rest.includes('\\')) return null;

  const base = path.basename(rest);
  if (!base || base === '.' || base === '..') return null;
  if (base !== rest) return null;

  return base;
}

/**
 * Caminho em disco para um valor de thumbnail/URL de upload, ou null.
 * @param {unknown} value
 * @returns {string|null}
 */
function thumbnailDiskPath(value) {
  const filename = filenameFromUploadsUrl(value);
  if (!filename) return null;
  return path.join(resolveUploadDir(), filename);
}

module.exports = {
  resolveUploadDir,
  filenameFromUploadsUrl,
  thumbnailDiskPath,
  DEFAULT_RELATIVE,
};
