const crypto = require('crypto');

process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN = 'test-verify-token';
process.env.INSTAGRAM_APP_SECRET = 'test-app-secret';

const request = require('supertest');
const app = require('../src/app');

function signBody(rawBody, secret) {
  return `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
}

describe('Instagram webhook Meta', () => {
  it('GET deve responder o hub.challenge quando o verify token confere', async () => {
    const challenge = 'ch_abc123';
    const res = await request(app)
      .get('/webhooks/instagram')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'test-verify-token',
        'hub.challenge': challenge,
      });
    expect(res.status).toBe(200);
    expect(res.text).toBe(challenge);
  });

  it('GET deve retornar 403 quando o verify token não confere', async () => {
    const res = await request(app)
      .get('/webhooks/instagram')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'token-errado',
        'hub.challenge': 'x',
      });
    expect(res.status).toBe(403);
  });

  it('POST deve aceitar payload com assinatura válida', async () => {
    const raw = JSON.stringify({ object: 'instagram', entry: [] });
    const sig = signBody(Buffer.from(raw, 'utf8'), process.env.INSTAGRAM_APP_SECRET);
    const res = await request(app)
      .post('/webhooks/instagram')
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature-256', sig)
      .send(raw);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
  });

  it('POST deve rejeitar quando a assinatura é inválida', async () => {
    const raw = JSON.stringify({ object: 'instagram', entry: [] });
    const res = await request(app)
      .post('/webhooks/instagram')
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature-256', 'sha256=deadbeef')
      .send(raw);
    expect(res.status).toBe(403);
  });
});
