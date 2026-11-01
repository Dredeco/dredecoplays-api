const multer = require('multer');
const path = require('path');
const { resolveUploadDir } = require('../config/uploadDir');

// Falha cedo no boot se UPLOAD_DIR for inválido (ex.: dentro do app em produção).
resolveUploadDir();

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    const err = new Error('Tipo de arquivo não permitido. Use: jpg, jpeg, png, gif ou webp.');
    err.status = 400;
    cb(err);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
});

module.exports = upload;
