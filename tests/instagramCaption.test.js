const {
  buildInstagramFeedCaption,
  buildInstagramReelsCaption,
  parseVideoContentUrl,
} = require('../src/utils/instagramCaption');

describe('instagramCaption', () => {
  it('buildInstagramFeedCaption inclui título, link e hashtags', () => {
    const text = buildInstagramFeedCaption({
      title: 'Teste de artigo',
      excerpt: 'Um resumo curto.',
      postUrl: 'https://dredecoplays.com.br/blog/teste-de-artigo',
    });
    expect(text).toContain('📰 Teste de artigo');
    expect(text).toContain('Um resumo curto.');
    expect(text).toContain('#DredecoPlays');
    expect(text).toContain('https://dredecoplays.com.br/blog/teste-de-artigo');
  });

  it('parseVideoContentUrl retorna HTTPS do contentUrl', () => {
    expect(
      parseVideoContentUrl(
        JSON.stringify({
          name: 'Vídeo',
          contentUrl: 'https://cdn.example.com/v.mp4',
        }),
      ),
    ).toBe('https://cdn.example.com/v.mp4');
  });

  it('parseVideoContentUrl rejeita HTTP sem S', () => {
    expect(parseVideoContentUrl(JSON.stringify({ contentUrl: 'http://x.com/v.mp4' }))).toBeNull();
  });

  it('buildInstagramReelsCaption inclui título e link', () => {
    const text = buildInstagramReelsCaption({
      title: 'Meu reel',
      postUrl: 'https://dredecoplays.com.br/blog/meu-reel',
    });
    expect(text).toContain('Meu reel');
    expect(text).toContain('https://dredecoplays.com.br/blog/meu-reel');
  });
});
