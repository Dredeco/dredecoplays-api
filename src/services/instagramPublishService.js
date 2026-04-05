const { buildInstagramFeedCaption, buildInstagramReelsCaption, parseVideoContentUrl } = require('../utils/instagramCaption');

const GRAPH_VERSION = process.env.INSTAGRAM_GRAPH_VERSION || 'v21.0';

function graphUrl(path) {
  return `https://graph.facebook.com/${GRAPH_VERSION}${path}`;
}

function getAccessToken() {
  return process.env.INSTAGRAM_ACCESS_TOKEN || '';
}

function getIgUserId() {
  return process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '';
}

function getFrontendBase() {
  const u = process.env.FRONTEND_URL || 'https://dredecoplays.com.br';
  return u.replace(/\/$/, '');
}

/**
 * Resolve URL absoluta da thumbnail (valor bruto do banco).
 * @param {import('sequelize').Model} post
 */
function resolveImageUrl(post) {
  const raw = post.getDataValue('thumbnail');
  if (!raw || typeof raw !== 'string') return null;
  const t = raw.trim();
  if (!t) return null;
  if (t.startsWith('https://') || t.startsWith('http://')) return t.replace(/^http:\/\//i, 'https://');
  if (t.startsWith('/uploads/')) {
    const base = (process.env.BASE_URL || getFrontendBase()).replace(/\/$/, '');
    return `${base}${t}`;
  }
  return null;
}

async function graphPostForm(path, params) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) body.append(k, String(v));
  }
  const res = await fetch(graphUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const msg = json.error?.message || json.error_msg || res.statusText || 'Graph API error';
    const err = new Error(msg);
    err.graph = json;
    throw err;
  }
  return json;
}

/**
 * @param {string} creationId
 * @param {string} token
 * @param {string} igUserId
 */
async function publishCreation(creationId, token, igUserId) {
  return graphPostForm(`/${igUserId}/media_publish`, {
    creation_id: creationId,
    access_token: token,
  });
}

/** Vídeos/Reels processam de forma assíncrona — aguardar antes de media_publish. */
async function waitForMediaContainerFinished(containerId, token) {
  const maxAttempts = 45;
  for (let i = 0; i < maxAttempts; i += 1) {
    const url = `${graphUrl(`/${containerId}`)}?fields=status_code&access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url);
    const json = await res.json().catch(() => ({}));
    if (json.error) {
      const err = new Error(json.error.message || 'Erro ao consultar status do container');
      err.graph = json;
      throw err;
    }
    const code = json.status_code;
    if (code === 'FINISHED') return;
    if (code === 'ERROR') {
      throw new Error('Processamento do vídeo falhou no Instagram.');
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('Timeout aguardando o Instagram processar o vídeo.');
}

/**
 * Publica foto no feed.
 */
async function publishFeedPhoto({ igUserId, token, imageUrl, caption }) {
  const container = await graphPostForm(`/${igUserId}/media`, {
    image_url: imageUrl,
    caption,
    access_token: token,
  });
  const creationId = container.id;
  if (!creationId) throw new Error('Resposta sem creation id (feed).');
  const published = await publishCreation(creationId, token, igUserId);
  return published.id || creationId;
}

/**
 * Publica Reels (vídeo público HTTPS).
 */
async function publishReel({ igUserId, token, videoUrl, caption }) {
  const container = await graphPostForm(`/${igUserId}/media`, {
    media_type: 'REELS',
    video_url: videoUrl,
    caption,
    share_to_feed: 'true',
    access_token: token,
  });
  const creationId = container.id;
  if (!creationId) throw new Error('Resposta sem creation id (reels).');
  await waitForMediaContainerFinished(creationId, token);
  const published = await publishCreation(creationId, token, igUserId);
  return published.id || creationId;
}

/**
 * @param {import('sequelize').Model} post — instância Post
 */
async function publishPostToInstagram(post) {
  const token = getAccessToken();
  const igUserId = getIgUserId();
  if (!token || !igUserId) {
    return { skipped: true, reason: 'missing_token_or_ig_user_id' };
  }

  if (post.getDataValue('instagram_media_id')) {
    return { skipped: true, reason: 'already_published' };
  }

  const slug = post.getDataValue('slug');
  const title = post.getDataValue('title');
  const excerpt = post.getDataValue('excerpt');
  const videoRaw = post.getDataValue('video_json');
  const postUrl = `${getFrontendBase()}/blog/${slug}`;

  const preferReels =
    String(process.env.INSTAGRAM_PUBLISH_REELS || process.env.INSTAGRAM_AUTO_PUBLISH_REELS || 'true').toLowerCase() ===
    'true';
  const videoUrl = preferReels ? parseVideoContentUrl(videoRaw) : null;

  let mediaId;
  if (videoUrl) {
    const caption = buildInstagramReelsCaption({ title, postUrl });
    mediaId = await publishReel({ igUserId, token, videoUrl, caption });
  } else {
    const imageUrl = resolveImageUrl(post);
    if (!imageUrl) {
      const err = new Error('Post sem thumbnail HTTPS e sem video_json.contentUrl para Reels.');
      err.code = 'INSTAGRAM_NO_MEDIA';
      throw err;
    }
    const caption = buildInstagramFeedCaption({ title, excerpt, postUrl });
    mediaId = await publishFeedPhoto({ igUserId, token, imageUrl, caption });
  }

  await post.update({
    instagram_media_id: String(mediaId),
    instagram_published_at: new Date(),
    instagram_last_error: null,
  });

  return { mediaId: String(mediaId) };
}

module.exports = {
  publishPostToInstagram,
  resolveImageUrl,
  graphUrl,
};
