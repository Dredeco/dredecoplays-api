const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

const User = require('./User')(sequelize);
const Category = require('./Category')(sequelize);
const Tag = require('./Tag')(sequelize);
const Post = require('./Post')(sequelize);
const Product = require('./Product')(sequelize);

// Post pertence a User e Category
Post.belongsTo(User, { foreignKey: 'user_id', as: 'author' });
User.hasMany(Post, { foreignKey: 'user_id', as: 'posts' });

Post.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Category.hasMany(Post, { foreignKey: 'category_id', as: 'posts' });

// Post <-> Tag (N:N)
Post.belongsToMany(Tag, { through: 'post_tags', foreignKey: 'post_id', as: 'tags' });
Tag.belongsToMany(Post, { through: 'post_tags', foreignKey: 'tag_id', as: 'posts' });

module.exports = { sequelize, Sequelize, User, Category, Tag, Post, Product };
