'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('categories', [
      { name: 'Listas & Rankings', slug: 'listas-rankings', description: 'As melhores listas e rankings de jogos', color: '#8B5CF6', created_at: new Date(), updated_at: new Date() },
      { name: 'Reviews', slug: 'reviews', description: 'Análises completas e honestas dos melhores jogos', color: '#EC4899', created_at: new Date(), updated_at: new Date() },
      { name: 'Notícias', slug: 'noticias', description: 'As últimas novidades do mundo gamer', color: '#3B82F6', created_at: new Date(), updated_at: new Date() },
      { name: 'Guias & Dicas', slug: 'guias-dicas', description: 'Guias completos e dicas para dominar seus jogos', color: '#10B981', created_at: new Date(), updated_at: new Date() },
      { name: 'RPG / Soulslike', slug: 'rpg-soulslike', description: 'Tudo sobre RPGs e jogos Soulslike', color: '#F59E0B', created_at: new Date(), updated_at: new Date() },
      { name: 'Indie Games', slug: 'indie-games', description: 'Os melhores jogos independentes', color: '#6366F1', created_at: new Date(), updated_at: new Date() },
      { name: 'Nintendo', slug: 'nintendo', description: 'Notícias e reviews do universo Nintendo', color: '#EF4444', created_at: new Date(), updated_at: new Date() },
      { name: 'Xbox / PC', slug: 'xbox-pc', description: 'Tudo sobre Xbox e jogos de PC', color: '#22C55E', created_at: new Date(), updated_at: new Date() },
      { name: 'PlayStation', slug: 'playstation', description: 'Notícias, reviews e guias PlayStation', color: '#2563EB', created_at: new Date(), updated_at: new Date() },
      { name: 'FPS / Ação', slug: 'fps-acao', description: 'Os melhores FPS e jogos de ação', color: '#DC2626', created_at: new Date(), updated_at: new Date() },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('categories', null, {});
  },
};
