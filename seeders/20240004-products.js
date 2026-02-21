'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('products', [
      {
        name: 'Controle DualSense PS5',
        price: 349.90,
        original_price: 399.90,
        rating: 4.8,
        affiliate_url: 'https://amzn.to/exemplo1',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Headset Gamer HyperX Cloud II',
        price: 289.90,
        original_price: 349.90,
        rating: 4.7,
        affiliate_url: 'https://amzn.to/exemplo2',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Monitor Gamer 144Hz 27"',
        price: 1299.00,
        original_price: 1499.00,
        rating: 4.6,
        affiliate_url: 'https://amzn.to/exemplo3',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Teclado Mecânico Redragon',
        price: 179.90,
        original_price: 219.90,
        rating: 4.5,
        affiliate_url: 'https://amzn.to/exemplo4',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('products', null, {});
  },
};
