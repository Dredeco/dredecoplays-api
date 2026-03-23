const router = require('express').Router();
const seoController = require('../controllers/seoController');

router.get('/sitemap.xml', seoController.sitemap);
router.get('/feed.xml', seoController.feed);

module.exports = router;
