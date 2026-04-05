const HASHTAGS_MAIN = '#DredecoPlays #games #gaming';
const HASHTAGS_EXTRA = '#videogames #jogos';

function stripHtml(s) {
  return String(s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function excerptSnippet(excerpt, maxLen) {
  if (!excerpt || !String(excerpt).trim()) return '';
  const plain = stripHtml(excerpt);
  if (plain.length <= maxLen) return plain;
  return `${plain.slice(0, maxLen).trim()}…`;
}

/**
 * Legenda estilo feed (alinhada ao front share-captions).
 * @param {{ title: string, excerpt?: string | null, postUrl: string }} opts
 */
function buildInstagramFeedCaption(opts) {
  const { title, excerpt, postUrl } = opts;
  const shortExcerpt = excerptSnippet(excerpt, 220);
  const site = 'dredecoplays.com.br';
  return [
    `📰 ${title}`,
    '',
    shortExcerpt ? `${shortExcerpt}\n` : '',
    `${HASHTAGS_MAIN} ${HASHTAGS_EXTRA}`,
    '',
    '🔗 Leia na íntegra:',
    postUrl,
    '',
    `📲 ${site}`,
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, 2200);
}

/**
 * Legenda para Reels (vídeo do artigo).
 */
function buildInstagramReelsCaption(opts) {
  const { title, postUrl } = opts;
  const hook = title.trim().length <= 72 ? title.trim() : `${title.trim().slice(0, 72).trim()}…`;
  const lines = [
    `🔥 ${hook}`,
    '',
    `▶️ ${title}`,
    '',
    HASHTAGS_MAIN,
    '',
    '🔗 Link na bio',
    postUrl,
  ];
  return lines.join('\n').slice(0, 2200);
}

/**
 * Extrai URL de vídeo pública do video_json (mesmo contrato do front parseVideoJson).
 * @param {string | null | undefined} raw
 * @returns {string | null}
 */
function parseVideoContentUrl(raw) {
  if (!raw || !String(raw).trim()) return null;
  try {
    const v = JSON.parse(raw);
    const url = v.contentUrl || v.content_url;
    if (!url || typeof url !== 'string') return null;
    const u = url.trim();
    if (!u.startsWith('https://')) return null;
    return u;
  } catch {
    return null;
  }
}

module.exports = {
  buildInstagramFeedCaption,
  buildInstagramReelsCaption,
  parseVideoContentUrl,
};
