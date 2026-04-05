const crypto = require('crypto');

/**
 * Valida o cabeçalho X-Hub-Signature-256 enviado pela Meta (HMAC-SHA256 do corpo bruto).
 * @param {Buffer} rawBody
 * @param {string|undefined} signatureHeader
 * @param {string} appSecret
 * @returns {boolean}
 */
function verifyMetaSignature256(rawBody, signatureHeader, appSecret) {
  if (!appSecret || !signatureHeader || !rawBody || !Buffer.isBuffer(rawBody)) {
    return false;
  }
  const expected = `sha256=${crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
  const a = Buffer.from(signatureHeader, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

module.exports = { verifyMetaSignature256 };
