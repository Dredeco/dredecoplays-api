const router = require('express').Router();
const { body } = require('express-validator');
const usersController = require('../controllers/usersController');
const validate = require('../middlewares/validate');
const { authenticate, requireAdmin } = require('../middlewares/auth');

router.get('/', authenticate, requireAdmin, usersController.list);
router.get('/:id', authenticate, requireAdmin, usersController.show);

router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('name').notEmpty().withMessage('Nome obrigatório.'),
    body('email').isEmail().withMessage('Email inválido.'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter ao menos 6 caracteres.'),
  ],
  validate,
  usersController.create
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  [
    body('name').optional().notEmpty().withMessage('Nome não pode ser vazio.'),
    body('email').optional().isEmail().withMessage('Email inválido.'),
    body('password').optional().isLength({ min: 6 }).withMessage('Senha deve ter ao menos 6 caracteres.'),
    body('role').optional().isIn(['admin', 'editor']).withMessage('Role deve ser admin ou editor.'),
  ],
  validate,
  usersController.update
);
router.delete('/:id', authenticate, requireAdmin, usersController.destroy);

module.exports = router;
