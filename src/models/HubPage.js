const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HubPage = sequelize.define(
    'HubPage',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      slug: {
        type: DataTypes.STRING(160),
        allowNull: false,
        unique: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meta_description: {
        type: DataTypes.STRING(320),
        allowNull: true,
      },
    },
    {
      tableName: 'hub_pages',
    },
  );

  return HubPage;
};
