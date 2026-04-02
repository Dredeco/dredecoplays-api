const { Op } = require('sequelize');
const slugify = require('slugify');
const { Post, User, Category, Tag, Product } = require('../models');

const postIncludes = [
  { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
  { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'color'] },
  { model: Tag, as: 'tags', attributes: ['id', 'name', 'slug'], through: { attributes: [] } },
  {
    model: Product,
    as: 'linkedProducts',
    attributes: ['id', 'name', 'image', 'price', 'original_price', 'rating', 'affiliate_url', 'active', 'category'],
    through: { attributes: ['sort_order'] },
    required: false,
  },
];

async function syncLinkedProducts(post, linkedProductIds) {
  if (linkedProductIds === undefined) return;
  if (!Array.isArray(linkedProductIds)) return;
  const ids = linkedProductIds
    .map((id) => parseInt(id, 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (ids.length === 0) {
    await post.setLinkedProducts([]);
    return;
  }
  const products = await Product.findAll({ where: { id: ids } });
  const byId = new Map(products.map((p) => [p.id, p]));
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean);
  await post.setLinkedProducts(ordered);
  const sequelize = Post.sequelize;
  for (let i = 0; i < ids.length; i++) {
    await sequelize.query(
      'UPDATE post_products SET sort_order = :sort WHERE post_id = :postId AND product_id = :productId',
      { replacements: { sort: i, postId: post.id, productId: ids[i] } },
    );
  }
}

exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, tag, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    // Apenas admin pode ver drafts
    if (!req.user) {
      where.status = 'published';
    } else if (status) {
      where.status = status;
    }

    const searchTerm = typeof search === 'string' ? search.trim().slice(0, 100) : '';
    if (searchTerm) {
      where[Op.or] = [
        { title: { [Op.like]: `%${searchTerm}%` } },
        { excerpt: { [Op.like]: `%${searchTerm}%` } },
      ];
    }

    const include = [...postIncludes];

    if (category) {
      include[1] = { ...include[1], where: { slug: category } };
    }

    const tagFilter = tag
      ? [{ model: Tag, as: 'tags', attributes: ['id', 'name', 'slug'], through: { attributes: [] }, where: { slug: tag } }]
      : null;

    const { count, rows } = await Post.findAndCountAll({
      where,
      include: tagFilter || include,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
      distinct: true,
    });

    res.json({
      data: rows,
      meta: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.featured = async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { featured: true, status: 'published' },
      include: postIncludes,
      order: [['created_at', 'DESC']],
    });
    res.json({ data: post });
  } catch (err) {
    next(err);
  }
};

exports.popular = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const posts = await Post.findAll({
      where: { status: 'published' },
      include: postIncludes,
      order: [['views', 'DESC']],
      limit,
    });
    res.json({ data: posts });
  } catch (err) {
    next(err);
  }
};

exports.recent = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const posts = await Post.findAll({
      where: { status: 'published' },
      include: postIncludes,
      order: [['created_at', 'DESC']],
      limit,
    });
    res.json({ data: posts });
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { slug: req.params.slug },
      include: postIncludes,
    });
    if (!post) return res.status(404).json({ error: 'Post não encontrado.' });
    if (post.status !== 'published' && !req.user) {
      return res.status(404).json({ error: 'Post não encontrado.' });
    }
    await post.increment('views');
    res.json({ data: post });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { title, excerpt, content, thumbnail, status, featured, category_id, tags, user_id, linked_product_ids, faq_json, video_json, howto_json } = req.body;
    const slug = slugify(title, { lower: true, strict: true, locale: 'pt' });

    // Aceita user_id do payload se válido; caso contrário usa o usuário autenticado
    let authorId = req.user.id;
    if (user_id) {
      const targetUser = await User.findByPk(user_id);
      if (targetUser) authorId = targetUser.id;
    }

    const post = await Post.create({
      title,
      slug,
      excerpt,
      content,
      thumbnail,
      status: status || 'draft',
      featured: featured || false,
      category_id: category_id || null,
      user_id: authorId,
      faq_json: faq_json ?? null,
      video_json: video_json ?? null,
      howto_json: howto_json ?? null,
    });

    if (tags && Array.isArray(tags) && tags.length) {
      const tagInstances = await Tag.findAll({ where: { id: tags } });
      await post.setTags(tagInstances);
    }

    if (linked_product_ids !== undefined) {
      await syncLinkedProducts(post, linked_product_ids);
    }

    const full = await Post.findByPk(post.id, { include: postIncludes });
    res.status(201).json({ data: full });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado.' });

    const { title, excerpt, content, thumbnail, status, featured, category_id, tags, linked_product_ids, faq_json, video_json, howto_json } = req.body;
    const updates = {};
    if (excerpt !== undefined) updates.excerpt = excerpt;
    if (content !== undefined) updates.content = content;
    if (thumbnail !== undefined) updates.thumbnail = thumbnail;
    if (status !== undefined) updates.status = status;
    if (featured !== undefined) updates.featured = featured;
    if (category_id !== undefined) updates.category_id = category_id;
    if (faq_json !== undefined) updates.faq_json = faq_json;
    if (video_json !== undefined) updates.video_json = video_json;
    if (howto_json !== undefined) updates.howto_json = howto_json;
    if (title && title !== post.title) {
      updates.title = title;
      updates.slug = slugify(title, { lower: true, strict: true, locale: 'pt' });
    }

    if (Object.keys(updates).length > 0) await post.update(updates);

    if (tags && Array.isArray(tags)) {
      const tagInstances = await Tag.findAll({ where: { id: tags } });
      await post.setTags(tagInstances);
    }

    if (linked_product_ids !== undefined) {
      await syncLinkedProducts(post, linked_product_ids);
    }

    const full = await Post.findByPk(post.id, { include: postIncludes });
    res.json({ data: full });
  } catch (err) {
    next(err);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado.' });
    await post.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

exports.publish = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado.' });
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    await post.update({ status: newStatus });
    res.json({ data: { id: post.id, status: newStatus } });
  } catch (err) {
    next(err);
  }
};
