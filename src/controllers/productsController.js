const { Product } = require('../models');

exports.list = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: { active: true },
      order: [['created_at', 'DESC']],
    });
    res.json({ data: products });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, image, price, original_price, rating, affiliate_url } = req.body;
    const product = await Product.create({ name, image, price, original_price, rating, affiliate_url });
    res.status(201).json({ data: product });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });
    const { name, image, price, original_price, rating, affiliate_url, active } = req.body;
    await product.update({ name, image, price, original_price, rating, affiliate_url, active });
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
