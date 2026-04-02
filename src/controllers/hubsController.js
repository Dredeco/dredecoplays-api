const { HubPage, Post, User, Category, Tag } = require('../models');

const postIncludes = [
  { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
  { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'color'] },
  { model: Tag, as: 'tags', attributes: ['id', 'name', 'slug'], through: { attributes: [] } },
];

exports.list = async (req, res, next) => {
  try {
    const hubs = await HubPage.findAll({ order: [['title', 'ASC']] });
    res.json({ data: hubs });
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const hub = await HubPage.findOne({
      where: { slug: req.params.slug },
      include: [
        {
          model: Post,
          as: 'posts',
          through: { attributes: ['sort_order'] },
          required: false,
          include: postIncludes,
        },
      ],
    });
    if (!hub) return res.status(404).json({ error: 'Página não encontrada.' });

    const plain = hub.get({ plain: true });
    if (Array.isArray(plain.posts)) {
      plain.posts = plain.posts
        .filter((p) => p.status === 'published')
        .sort((a, b) => {
          const ao =
            a.hub_page_posts?.sort_order ??
            a.HubPagePost?.sort_order ??
            0;
          const bo =
            b.hub_page_posts?.sort_order ??
            b.HubPagePost?.sort_order ??
            0;
          return ao - bo;
        });
    }

    res.json({ data: plain });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { slug, title, description, meta_description, post_ids } = req.body;
    const hub = await HubPage.create({
      slug,
      title,
      description: description || null,
      meta_description: meta_description || null,
    });
    if (post_ids && Array.isArray(post_ids) && post_ids.length) {
      const posts = await Post.findAll({ where: { id: post_ids } });
      await hub.setPosts(posts);
      const sequelize = HubPage.sequelize;
      for (let i = 0; i < post_ids.length; i++) {
        await sequelize.query(
          'UPDATE hub_page_posts SET sort_order = :sort WHERE hub_id = :hubId AND post_id = :postId',
          { replacements: { sort: i, hubId: hub.id, postId: post_ids[i] } },
        );
      }
    }
    const full = await HubPage.findByPk(hub.id, {
      include: [{ model: Post, as: 'posts', through: { attributes: ['sort_order'] } }],
    });
    res.status(201).json({ data: full });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const hub = await HubPage.findByPk(req.params.id);
    if (!hub) return res.status(404).json({ error: 'Hub não encontrado.' });
    const { slug, title, description, meta_description, post_ids } = req.body;
    await hub.update({
      ...(slug !== undefined && { slug }),
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(meta_description !== undefined && { meta_description }),
    });
    if (post_ids !== undefined && Array.isArray(post_ids)) {
      const posts = await Post.findAll({ where: { id: post_ids } });
      await hub.setPosts(posts);
      const sequelize = HubPage.sequelize;
      for (let i = 0; i < post_ids.length; i++) {
        await sequelize.query(
          'UPDATE hub_page_posts SET sort_order = :sort WHERE hub_id = :hubId AND post_id = :postId',
          { replacements: { sort: i, hubId: hub.id, postId: post_ids[i] } },
        );
      }
    }
    const full = await HubPage.findByPk(hub.id, {
      include: [{ model: Post, as: 'posts', through: { attributes: ['sort_order'] }, include: postIncludes }],
    });
    res.json({ data: full });
  } catch (err) {
    next(err);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const hub = await HubPage.findByPk(req.params.id);
    if (!hub) return res.status(404).json({ error: 'Hub não encontrado.' });
    await hub.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
