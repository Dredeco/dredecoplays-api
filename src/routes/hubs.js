const router = require('express').Router();
const { body } = require('express-validator');
const hubsController = require('../controllers/hubsController');
const validate = require('../middlewares/validate');
const { authenticate, requireAdmin } = require('../middlewares/auth');

router.get('/', hubsController.list);
router.get('/:slug', hubsController.show);

router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('slug').notEmpty().withMessage('Slug obrigatório.'),
    body('title').notEmpty().withMessage('Título obrigatório.'),
  ],
  validate,
  hubsController.create,
);

router.put('/:id', authenticate, requireAdmin, hubsController.update);
router.delete('/:id', authenticate, requireAdmin, hubsController.destroy);

module.exports = router;
