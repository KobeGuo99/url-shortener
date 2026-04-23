const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '..', '..', '..', '.env'),
});

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 8080),
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/url_shortener',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  BASE_URL: (process.env.BASE_URL || 'http://localhost:8080').replace(/\/+$/, ''),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  CACHE_TTL_SECONDS: 60 * 60 * 24,
  RATE_LIMIT_WINDOW_SECONDS: 60,
  RATE_LIMIT_MAX_REQUESTS: 10,
};

module.exports = env;
