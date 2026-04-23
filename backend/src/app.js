const path = require('path');
const { redisClient, pool } = require('./db');
const env = require('./config/env');
const { createUrlRepository } = require('./repositories/urlRepository');
const { createClickRepository } = require('./repositories/clickRepository');
const { createCacheService } = require('./services/cacheService');
const { createUrlService } = require('./services/urlService');
const { createAnalyticsService } = require('./services/analyticsService');
const { createRateLimiter } = require('./middleware/rateLimiter');
const { buildRouter } = require('./routes/buildRouter');

function createApp(overrides = {}) {
  const urlRepository = overrides.urlRepository || createUrlRepository(pool);
  const clickRepository = overrides.clickRepository || createClickRepository(pool);
  const cacheService =
    overrides.cacheService || createCacheService(redisClient, env.CACHE_TTL_SECONDS);
  const urlService =
    overrides.urlService || createUrlService({ urlRepository, cacheService });
  const analyticsService =
    overrides.analyticsService ||
    createAnalyticsService({ urlRepository, clickRepository });
  const rateLimiter = overrides.rateLimiter || createRateLimiter(redisClient);

  return buildRouter({
    urlService,
    analyticsService,
    rateLimiter,
    staticDir:
      overrides.staticDir ||
      path.resolve(__dirname, '..', '..', 'frontend', 'dist'),
  });
}

module.exports = {
  createApp,
};
