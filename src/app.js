require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const categoriesRoutes = require('./routes/categories');
const tagsRoutes = require('./routes/tags');
const productsRoutes = require('./routes/products');
const uploadRoutes = require('./routes/upload');
const usersRoutes = require('./routes/users');
const seoRoutes = require('./routes/seo');
const affiliateClicksRoutes = require('./routes/affiliateClicks');
const hubsRoutes = require('./routes/hubs');
const instagramWebhookRoutes = require('./routes/instagramWebhook');

const app = express();

// Em produção atrás de proxy, permite req.protocol e X-Forwarded-* corretos
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),
);
const allowedOrigins =
  process.env.NODE_ENV === 'production' ? ['https://dredecoplays.com.br'] : true;
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(
  express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      if (req.originalUrl.startsWith('/webhooks/instagram')) {
        req.rawBody = buf;
      }
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Servir arquivos de upload como estáticos
app.use('/uploads', express.static(path.resolve('public/uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SEO: sitemap e feed RSS (rotas públicas na raiz)
app.use('/', seoRoutes);

// Instagram Graph API — webhooks Meta (URL de callback no painel do desenvolvedor)
app.use('/webhooks/instagram', instagramWebhookRoutes);

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/affiliate-clicks', affiliateClicksRoutes);
app.use('/api/hubs', hubsRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

app.use(errorHandler);

module.exports = app;
