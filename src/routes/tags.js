const router = require('express').Router();
const { body } = require('express-validator');
const tagsController = require('../controllers/tagsController');
const validate = require('../middlewares/validate');
const { authenticate, requireAdmin } = require('../middlewares/auth');

router.get('/', tagsController.list);

router.post(
  '/',
  authenticate,
  requireAdmin,
  [body('name').notEmpty().withMessage('Nome obrigatório.')],
  validate,
  tagsController.create
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  [body('name').notEmpty().withMessage('Nome obrigatório.')],
  validate,
  tagsController.update
);

router.delete('/:id', authenticate, requireAdmin, tagsController.destroy);

module.exports = router;
