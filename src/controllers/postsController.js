const { Op } = require('sequelize');
const slugify = require('slugify');
const { Post, User, Category, Tag } = require('../models');

const postIncludes = [
  { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
  { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'color'] },
  { model: Tag, as: 'tags', attributes: ['id', 'name', 'slug'], through: { attributes: [] } },
];

exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, tag, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    // Apenas admin pode ver drafts
    if (!req.user) {
      where.status = 'published';
    } else if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { excerpt: { [Op.like]: `%${search}%` } },
      ];
    }

    const include = [...postIncludes];

    if (category) {
      include[1] = { ...include[1], where: { slug: category } };
    }

    const tagFilter = tag
      ? [{ model: Tag, as: 'tags', attributes: ['id', 'name', 'slug'], through: { attributes: [] }, where: { slug: tag } }]
      : null;

    const { count, rows } = await Post.findAndCountAll({
      where,
      include: tagFilter || include,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
      distinct: true,
    });

    res.json({
      data: rows,
      meta: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.featured = async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { featured: true, status: 'published' },
      include: postIncludes,
      order: [['created_at', 'DESC']],
    });
    res.json({ data: post });
  } catch (err) {
    next(err);
  }
};

exports.popular = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const posts = await Post.findAll({
      where: { status: 'published' },
      include: postIncludes,
      order: [['views', 'DESC']],
      limit,
    });
    res.json({ data: posts });
  } catch (err) {
    next(err);
  }
};

exports.recent = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const posts = await Post.findAll({
      where: { status: 'published' },
      include: postIncludes,
      order: [['created_at', 'DESC']],
      limit,
    });
    res.json({ data: posts });
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { slug: req.params.slug },
      include: postIncludes,
    });
    if (!post) return res.status(404).json({ error: 'Post não encontrado.' });
    if (post.status !== 'published' && !req.user) {
      return res.status(404).json({ error: 'Post não encontrado.' });
    }
    await post.increment('views');
    res.json({ data: post });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { title, excerpt, content, thumbnail, status, featured, category_id, tags } = req.body;
    const slug = slugify(title, { lower: true, strict: true, locale: 'pt' });

    const post = await Post.create({
      title,
      slug,
      excerpt,
      content,
      thumbnail,
      status: status || 'draft',
      featured: featured || false,
      category_id: category_id || null,
      user_id: req.user.id,
    });

    if (tags && Array.isArray(tags) && tags.length) {
      const tagInstances = await Tag.findAll({ where: { id: tags } });
      await post.setTags(tagInstances);
    }

    const full = await Post.findByPk(post.id, { include: postIncludes });
    res.status(201).json({ data: full });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado.' });

    const { title, excerpt, content, thumbnail, status, featured, category_id, tags } = req.body;
    const updates = { excerpt, content, thumbnail, status, featured, category_id };
    if (title && title !== post.title) {
      updates.title = title;
      updates.slug = slugify(title, { lower: true, strict: true, locale: 'pt' });
    }

    await post.update(updates);

    if (tags && Array.isArray(tags)) {
      const tagInstances = await Tag.findAll({ where: { id: tags } });
      await post.setTags(tagInstances);
    }

    const full = await Post.findByPk(post.id, { include: postIncludes });
    res.json({ data: full });
  } catch (err) {
    next(err);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado.' });
    await post.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

exports.publish = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado.' });
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    await post.update({ status: newStatus });
    res.json({ data: { id: post.id, status: newStatus } });
  } catch (err) {
    next(err);
  }
};
