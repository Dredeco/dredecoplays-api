const { AffiliateClick } = require('../models');

exports.create = async (req, res, next) => {
  try {
    const { product_id, post_id, target_url } = req.body;
    await AffiliateClick.create({
      product_id: product_id != null ? parseInt(product_id, 10) : null,
      post_id: post_id != null ? parseInt(post_id, 10) : null,
      target_url: typeof target_url === 'string' ? target_url.slice(0, 500) : null,
      referrer: (req.get('referer') || '').slice(0, 500) || null,
      user_agent: (req.get('user-agent') || '').slice(0, 500) || null,
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
};
