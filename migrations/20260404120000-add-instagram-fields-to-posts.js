'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('posts', 'instagram_media_id', {
      type: Sequelize.STRING(64),
      allowNull: true,
    });
    await queryInterface.addColumn('posts', 'instagram_published_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('posts', 'instagram_last_error', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('posts', 'instagram_last_error');
    await queryInterface.removeColumn('posts', 'instagram_published_at');
    await queryInterface.removeColumn('posts', 'instagram_media_id');
  },
};
