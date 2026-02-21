const router = require('express').Router();
const { body } = require('express-validator');
const productsController = require('../controllers/productsController');
const validate = require('../middlewares/validate');
const { authenticate, requireAdmin } = require('../middlewares/auth');

router.get('/', productsController.list);

router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('name').notEmpty().withMessage('Nome obrigatório.'),
    body('price').isFloat({ min: 0 }).withMessage('Preço inválido.'),
    body('affiliate_url').isURL().withMessage('URL de afiliado inválida.'),
  ],
  validate,
  productsController.create
);

router.put('/:id', authenticate, requireAdmin, productsController.update);
router.delete('/:id', authenticate, requireAdmin, productsController.destroy);

module.exports = router;
