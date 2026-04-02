const { Sequelize } = require('sequelize');
const { Product } = require('../models');

exports.show = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }
    const product = await Product.findByPk(id);
    if (!product || !product.active) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const where = {};
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin || req.query.active !== 'false') {
      where.active = true;
    }
    if (req.query.category && typeof req.query.category === 'string') {
      where.category = req.query.category.trim();
    }

    let order = [['created_at', 'DESC']];
    if (req.query.sort === 'discount') {
      order = [
        [
          Sequelize.literal(
            'CASE WHEN original_price IS NOT NULL AND original_price > price THEN (original_price - price) / original_price ELSE 0 END',
          ),
          'DESC',
        ],
        ['created_at', 'DESC'],
      ];
    }

    let products = await Product.findAll({
      where,
      order,
    });

    if (req.query.sort === 'price_asc') {
      products = [...products].sort((a, b) => Number(a.price) - Number(b.price));
    }
    if (req.query.sort === 'price_desc') {
      products = [...products].sort((a, b) => Number(b.price) - Number(a.price));
    }

    res.json({ data: products });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, image, price, original_price, rating, affiliate_url, category } = req.body;
    const product = await Product.create({
      name,
      image,
      price,
      original_price,
      rating,
      affiliate_url,
      category: category || null,
    });
    res.status(201).json({ data: product });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });
    const { name, image, price, original_price, rating, affiliate_url, active, category } = req.body;
    await product.update({
      name,
      image,
      price,
      original_price,
      rating,
      affiliate_url,
      active,
      category: category !== undefined ? category : product.category,
    });
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });
    await product.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
