'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('affiliate_clicks', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      product_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'products', key: 'id' },
        onDelete: 'SET NULL',
      },
      post_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'posts', key: 'id' },
        onDelete: 'SET NULL',
      },
      target_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      referrer: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
    await queryInterface.addIndex('affiliate_clicks', ['product_id']);
    await queryInterface.addIndex('affiliate_clicks', ['post_id']);
    await queryInterface.addIndex('affiliate_clicks', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('affiliate_clicks');
  },
};
