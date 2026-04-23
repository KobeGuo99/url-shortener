const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const pinoHttp = require('pino-http');
const env = require('../config/env');
const { asyncHandler } = require('../utils/asyncHandler');
const { notFoundHandler, errorHandler } = require('../middleware/errorHandler');

function buildRouter({ urlService, analyticsService, rateLimiter, staticDir }) {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', true);
  app.use(
    pinoHttp({
      autoLogging: env.NODE_ENV !== 'test',
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
    }),
  );
  app.use(express.json());

  app.get('/health', asyncHandler(async (_req, res) => {
    res.json({
      status: 'ok',
    });
  }));

  app.post('/shorten', rateLimiter, asyncHandler(async (req, res) => {
    const result = await urlService.shortenUrl(req.body?.url);
    res.status(201).json(result);
  }));

  app.get('/analytics/:code', rateLimiter, asyncHandler(async (req, res) => {
    const result = await analyticsService.getAnalytics(req.params.code);
    res.json(result);
  }));

  if (staticDir && fs.existsSync(staticDir)) {
    app.use(express.static(staticDir));
  }

  app.get('/:code', rateLimiter, asyncHandler(async (req, res) => {
    const record = await urlService.getOriginalUrl(req.params.code);
    const userAgent = req.get('user-agent');
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : req.ip;

    setImmediate(() => {
      analyticsService.recordClick({
        shortCode: req.params.code,
        userAgent,
        ip,
      }).catch((error) => {
        console.error('Failed to record click analytics:', error.message);
      });
    });

    res.redirect(302, record.original_url);
  }));

  if (staticDir && fs.existsSync(path.join(staticDir, 'index.html'))) {
    app.get('/', (_req, res) => {
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = {
  buildRouter,
};
