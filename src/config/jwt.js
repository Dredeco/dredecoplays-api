module.exports = {
  secret: process.env.JWT_SECRET || 'fallback_secret_dev_only',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
