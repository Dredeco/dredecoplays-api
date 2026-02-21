const slugify = require('slugify');
const { Tag } = require('../models');

exports.list = async (req, res, next) => {
  try {
    const tags = await Tag.findAll({ order: [['name', 'ASC']] });
    res.json({ data: tags });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name } = req.body;
    const slug = slugify(name, { lower: true, strict: true, locale: 'pt' });
    const tag = await Tag.create({ name, slug });
    res.status(201).json({ data: tag });
  } catch (err) {
    next(err);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const tag = await Tag.findByPk(req.params.id);
    if (!tag) return res.status(404).json({ error: 'Tag não encontrada.' });
    await tag.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
