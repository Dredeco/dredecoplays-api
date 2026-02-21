const router = require('express').Router();
const { body } = require('express-validator');
const categoriesController = require('../controllers/categoriesController');
const validate = require('../middlewares/validate');
const { authenticate, requireAdmin } = require('../middlewares/auth');

router.get('/', categoriesController.list);
router.get('/:slug/posts', categoriesController.posts);

router.post(
  '/',
  authenticate,
  requireAdmin,
  [body('name').notEmpty().withMessage('Nome obrigatório.')],
  validate,
  categoriesController.create
);

router.put('/:id', authenticate, requireAdmin, categoriesController.update);
router.delete('/:id', authenticate, requireAdmin, categoriesController.destroy);

module.exports = router;
