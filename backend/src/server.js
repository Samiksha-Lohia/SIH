import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

/**
 * Process entry point: connect to the DB (best-effort), start the HTTP server,
 * and wire graceful shutdown.
 */
async function start() {
  await connectDB();

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`SUTRA backend listening on port ${env.port} (${env.nodeEnv})`);
    logger.info(`Health check: http://localhost:${env.port}/api/health`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    server.close(async () => {
      await disconnectDB();
      logger.info('Shutdown complete');
      process.exit(0);
    });
    // Force-exit if it hangs
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason: String(reason) });
  });
  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught exception: ${err.message}`, { stack: err.stack });
  });
}

start();
