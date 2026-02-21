const slugify = require('slugify');
const { Category, Post, User, Tag } = require('../models');

exports.list = async (req, res, next) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
};

exports.posts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const category = await Category.findOne({ where: { slug: req.params.slug } });
    if (!category) return res.status(404).json({ error: 'Categoria não encontrada.' });

    const { count, rows } = await Post.findAndCountAll({
      where: { category_id: category.id, status: 'published' },
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'color'] },
        { model: Tag, as: 'tags', attributes: ['id', 'name', 'slug'], through: { attributes: [] } },
      ],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
      distinct: true,
    });

    res.json({
      data: rows,
      category,
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

exports.create = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    const slug = slugify(name, { lower: true, strict: true, locale: 'pt' });
    const category = await Category.create({ name, slug, description, color });
    res.status(201).json({ data: category });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Categoria não encontrada.' });
    const { name, description, color } = req.body;
    const updates = { description, color };
    if (name && name !== category.name) {
      updates.name = name;
      updates.slug = slugify(name, { lower: true, strict: true, locale: 'pt' });
    }
    await category.update(updates);
    res.json({ data: category });
  } catch (err) {
    next(err);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Categoria não encontrada.' });
    await category.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
