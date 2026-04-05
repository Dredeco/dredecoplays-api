const { verifyMetaSignature256 } = require('../utils/instagramWebhookSignature');

const VERIFY_TOKEN_ENV = 'INSTAGRAM_WEBHOOK_VERIFY_TOKEN';
const APP_SECRET_ENV = 'INSTAGRAM_APP_SECRET';

/**
 * GET — verificação inicial do webhook (Meta envia hub.mode, hub.verify_token, hub.challenge).
 */
function verify(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expected = process.env[VERIFY_TOKEN_ENV];
  if (!expected || typeof expected !== 'string' || expected.length === 0) {
    console.warn(`[instagram webhook] ${VERIFY_TOKEN_ENV} não configurado`);
    return res.status(503).send('Webhook não configurado');
  }

  if (mode === 'subscribe' && token === expected && typeof challenge === 'string') {
    res.status(200).type('text/plain').send(challenge);
    return;
  }

  res.status(403).send('Forbidden');
}

/**
 * POST — eventos do Instagram (comentários, menções, etc.).
 * Responde 200 rapidamente; processamento pesado deve ser assíncrono (fila/worker) se necessário.
 */
function receive(req, res) {
  const appSecret = process.env[APP_SECRET_ENV];
  if (appSecret) {
    const signature = req.get('X-Hub-Signature-256');
    const rawBody = req.rawBody;
    if (!rawBody || !verifyMetaSignature256(rawBody, signature, appSecret)) {
      return res.status(403).send('Invalid signature');
    }
  }

  const payload = req.body;
  if (process.env.NODE_ENV === 'development' && payload && typeof payload === 'object') {
    console.log('[instagram webhook] evento recebido:', JSON.stringify(payload).slice(0, 2000));
  }

  // Aqui você pode encaminhar para fila, banco, etc.
  res.status(200).json({ received: true });
}

module.exports = { verify, receive };
