'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('posts', 'faq_json', {
      type: Sequelize.TEXT('long'),
      allowNull: true,
    });
    await queryInterface.addColumn('posts', 'video_json', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('posts', 'howto_json', {
      type: Sequelize.TEXT('long'),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('posts', 'howto_json');
    await queryInterface.removeColumn('posts', 'video_json');
    await queryInterface.removeColumn('posts', 'faq_json');
  },
};
