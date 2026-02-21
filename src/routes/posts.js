const router = require('express').Router();
const { body } = require('express-validator');
const postsController = require('../controllers/postsController');
const validate = require('../middlewares/validate');
const { authenticate, requireAdmin } = require('../middlewares/auth');

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  next();
};

const postValidation = [
  body('title').notEmpty().withMessage('Título obrigatório.'),
  body('content').notEmpty().withMessage('Conteúdo obrigatório.'),
];

router.get('/', optionalAuth, postsController.list);
router.get('/featured', postsController.featured);
router.get('/popular', postsController.popular);
router.get('/recent', postsController.recent);
router.get('/:slug', optionalAuth, postsController.show);

router.post('/', authenticate, requireAdmin, postValidation, validate, postsController.create);
router.put('/:id', authenticate, requireAdmin, postsController.update);
router.delete('/:id', authenticate, requireAdmin, postsController.destroy);
router.patch('/:id/publish', authenticate, requireAdmin, postsController.publish);

module.exports = router;
