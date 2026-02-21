const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'campo';
    return res.status(409).json({ error: `Já existe um registro com este ${field}.` });
  }

  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => e.message);
    return res.status(422).json({ error: 'Dados inválidos.', details: messages });
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Arquivo muito grande. Máximo 5MB.' });
    }
    return res.status(400).json({ error: err.message });
  }

  const status = err.status || 500;
  const message = status === 500 ? 'Erro interno do servidor.' : err.message;
  res.status(status).json({ error: message });
};

module.exports = errorHandler;
