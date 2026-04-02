const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Post = sequelize.define('Post', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(280),
      allowNull: false,
      unique: true,
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    thumbnail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      get() {
        const value = this.getDataValue('thumbnail');
        if (!value) return null;
        if (value.startsWith('/uploads/') && process.env.BASE_URL) {
          return process.env.BASE_URL.replace(/\/$/, '') + value;
        }
        return value;
      },
    },
    status: {
      type: DataTypes.ENUM('draft', 'published'),
      defaultValue: 'draft',
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    views: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    category_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    faq_json: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    video_json: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    howto_json: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
  }, {
    tableName: 'posts',
    indexes: [
      { fields: ['status'] },
      { fields: ['featured'] },
      { fields: ['views'] },
      { fields: ['created_at'] },
    ],
  });

  return Post;
};
