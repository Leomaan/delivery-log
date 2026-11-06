import { env } from './config/env';

// Phase 0 bootstrap placeholder. Fastify server initialization is added in Phase 1.
console.info(
  `[lunch-tracker] Environment validated (${env.NODE_ENV}) on ${env.HOST}:${String(env.PORT)}`,
);
