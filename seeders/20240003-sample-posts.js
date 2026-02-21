'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('posts', [
      {
        title: '5 Jogos Obrigatórios Para Quem Amou Elden Ring',
        slug: '5-jogos-obrigatorios-para-quem-amou-elden-ring',
        excerpt: 'Se você ficou apaixonado pelo mundo de Elden Ring, estes jogos vão te conquistar da mesma forma.',
        content: '<p>Elden Ring redefiniu o gênero Soulslike com seu mundo aberto incrível e boss fights épicos. Se você terminou o jogo e ficou com aquela saudade, separamos 5 títulos que vão preencher esse vazio.</p><h2>1. Dark Souls III</h2><p>O predecessor direto, com um dos melhores designs de fases da FromSoftware...</p><h2>2. Sekiro: Shadows Die Twice</h2><p>Um desafio diferente, focado em combate preciso com katana...</p>',
        status: 'published',
        featured: true,
        views: 1520,
        user_id: 1,
        category_id: 5,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        title: 'Segredos de Elden Ring que Você Provavelmente Não Conhece',
        slug: 'segredos-de-elden-ring',
        excerpt: 'Elden Ring está cheio de segredos escondidos. Descubra os mais impressionantes.',
        content: '<p>FromSoftware é conhecida por esconder segredos incríveis em seus jogos. Elden Ring não é diferente...</p>',
        status: 'published',
        featured: false,
        views: 3240,
        user_id: 1,
        category_id: 4,
        created_at: new Date(Date.now() - 86400000),
        updated_at: new Date(Date.now() - 86400000),
      },
      {
        title: 'Top 10 Jogos de Terror Que Vão Te Assustar de Verdade',
        slug: 'top-10-jogos-de-terror',
        excerpt: 'Uma seleção dos jogos de terror mais aterrorizantes já criados para todas as plataformas.',
        content: '<p>O gênero de terror nos games evoluiu muito nos últimos anos. Separamos os 10 títulos que mais vão te fazer pular da cadeira...</p>',
        status: 'published',
        featured: false,
        views: 2890,
        user_id: 1,
        category_id: 1,
        created_at: new Date(Date.now() - 172800000),
        updated_at: new Date(Date.now() - 172800000),
      },
      {
        title: 'Review Completo de Horizon Forbidden West',
        slug: 'review-completo-horizon-forbidden-west',
        excerpt: 'Horizon Forbidden West entrega tudo que os fãs esperavam? Confira nossa análise completa.',
        content: '<p>Guerrilla Games voltou com tudo em Horizon Forbidden West. A sequência expande cada aspecto do original de maneira impressionante...</p>',
        status: 'published',
        featured: false,
        views: 1870,
        user_id: 1,
        category_id: 2,
        created_at: new Date(Date.now() - 259200000),
        updated_at: new Date(Date.now() - 259200000),
      },
      {
        title: 'Review de God of War Ragnarök',
        slug: 'review-god-of-war-ragnarok',
        excerpt: 'God of War Ragnarök é a sequência que os fãs merecem? Nossa análise completa.',
        content: '<p>Santa Monica Studio mais uma vez supera as expectativas com God of War Ragnarök...</p>',
        status: 'published',
        featured: false,
        views: 2100,
        user_id: 1,
        category_id: 2,
        created_at: new Date(Date.now() - 345600000),
        updated_at: new Date(Date.now() - 345600000),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('posts', null, {});
  },
};
