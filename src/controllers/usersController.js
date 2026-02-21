const { User } = require('../models');

exports.list = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
    });
    res.json({ data: users });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await User.create({ name, email, password, role: role || 'editor' });
    res.status(201).json({ data: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    const { name, email, password, role } = req.body;
    await user.update({ name, email, password, role });
    res.json({ data: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Você não pode excluir sua própria conta.' });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    await user.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
