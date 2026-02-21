const router = require('express').Router();
const upload = require('../middlewares/upload');
const uploadController = require('../controllers/uploadController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

router.post('/image', authenticate, requireAdmin, upload.single('image'), uploadController.uploadImage);

module.exports = router;
