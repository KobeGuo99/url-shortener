const { createApp } = require('./app');
const { connectServices, closeServices, pool } = require('./db');
const { runMigrations } = require('./db/migrate');
const env = require('./config/env');

async function startServer() {
  await connectServices();
  await runMigrations(pool);

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`Backend listening on ${env.BASE_URL}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await closeServices();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return server;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = {
  startServer,
};
