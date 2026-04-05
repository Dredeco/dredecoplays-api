const router = require('express').Router();
const { verify, receive } = require('../controllers/instagramWebhookController');

router.get('/', verify);
router.post('/', receive);

module.exports = router;
