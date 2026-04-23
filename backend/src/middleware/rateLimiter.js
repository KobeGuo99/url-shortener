const env = require('../config/env');

function createRateLimiter(redisClient) {
  return async function rateLimiter(req, res, next) {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `ratelimit:${ip}`;
    const total = await redisClient.incr(key);

    if (total === 1) {
      await redisClient.expire(key, env.RATE_LIMIT_WINDOW_SECONDS);
    }

    if (total > env.RATE_LIMIT_MAX_REQUESTS) {
      return res.status(429).json({
        error: `Rate limit exceeded. Maximum ${env.RATE_LIMIT_MAX_REQUESTS} requests per minute per IP.`,
      });
    }

    return next();
  };
}

module.exports = {
  createRateLimiter,
};
