'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('posts', 'thumbnail', {
      type: Sequelize.TEXT('medium'),
      allowNull: true,
    });
    await queryInterface.changeColumn('products', 'image', {
      type: Sequelize.TEXT('medium'),
      allowNull: true,
    });
    await queryInterface.changeColumn('users', 'avatar', {
      type: Sequelize.TEXT('medium'),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('posts', 'thumbnail', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.changeColumn('products', 'image', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.changeColumn('users', 'avatar', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },
};
