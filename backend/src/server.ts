import { buildApp } from './app';
import { env } from './config/env';
import { logger } from './shared/lib/logger';

async function start(): Promise<void> {
  try {
    const app = await buildApp();

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    logger.info(
      `[lunch-tracker] Server running in ${env.NODE_ENV} mode at http://${env.HOST}:${String(env.PORT)}`,
    );
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

void start();
