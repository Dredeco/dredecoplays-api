const router = require('express').Router();
const { body } = require('express-validator');
const affiliateClicksController = require('../controllers/affiliateClicksController');
const validate = require('../middlewares/validate');

router.post(
  '/',
  [
    body('product_id').optional().isInt(),
    body('post_id').optional().isInt(),
    body('target_url').optional().isString().isLength({ max: 500 }),
  ],
  validate,
  affiliateClicksController.create,
);

module.exports = router;
