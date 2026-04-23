const { Pool } = require('pg');
const { createClient } = require('redis');
const env = require('../config/env');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on('error', (error) => {
  console.error('Redis client error:', error.message);
});

async function connectServices() {
  await pool.query('SELECT 1');

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

async function closeServices() {
  await Promise.allSettled([
    pool.end(),
    redisClient.isOpen ? redisClient.quit() : Promise.resolve(),
  ]);
}

module.exports = {
  pool,
  redisClient,
  connectServices,
  closeServices,
};
