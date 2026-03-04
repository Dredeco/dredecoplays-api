if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET não definido em produção.');
}

module.exports = {
  secret: process.env.JWT_SECRET || 'fallback_secret_dev_only',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
