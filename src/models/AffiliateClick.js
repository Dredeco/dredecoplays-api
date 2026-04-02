const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AffiliateClick = sequelize.define(
    'AffiliateClick',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      product_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      post_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      target_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      referrer: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
    },
    {
      tableName: 'affiliate_clicks',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    },
  );

  return AffiliateClick;
};
