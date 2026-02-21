const router = require('express').Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido.'),
    body('password').notEmpty().withMessage('Senha obrigatória.'),
  ],
  validate,
  authController.login
);

router.get('/me', authenticate, authController.me);

module.exports = router;
