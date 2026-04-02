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
const HubPage = require('./HubPage')(sequelize);
const AffiliateClick = require('./AffiliateClick')(sequelize);

// Post pertence a User e Category
Post.belongsTo(User, { foreignKey: 'user_id', as: 'author' });
User.hasMany(Post, { foreignKey: 'user_id', as: 'posts' });

Post.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Category.hasMany(Post, { foreignKey: 'category_id', as: 'posts' });

// Post <-> Tag (N:N)
Post.belongsToMany(Tag, { through: 'post_tags', foreignKey: 'post_id', as: 'tags' });
Tag.belongsToMany(Post, { through: 'post_tags', foreignKey: 'tag_id', as: 'posts' });

// Post <-> Product (N:N) — produtos recomendados no artigo
Post.belongsToMany(Product, {
  through: 'post_products',
  foreignKey: 'post_id',
  otherKey: 'product_id',
  as: 'linkedProducts',
});
Product.belongsToMany(Post, {
  through: 'post_products',
  foreignKey: 'product_id',
  otherKey: 'post_id',
  as: 'posts',
});

// Hub <-> Post (N:N)
HubPage.belongsToMany(Post, {
  through: 'hub_page_posts',
  foreignKey: 'hub_id',
  otherKey: 'post_id',
  as: 'posts',
});
Post.belongsToMany(HubPage, {
  through: 'hub_page_posts',
  foreignKey: 'post_id',
  otherKey: 'hub_id',
  as: 'hubs',
});

AffiliateClick.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
AffiliateClick.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Category,
  Tag,
  Post,
  Product,
  HubPage,
  AffiliateClick,
};
