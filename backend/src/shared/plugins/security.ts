import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { env } from '../../config/env';

export async function registerSecurityPlugins(app: FastifyInstance): Promise<void> {
  await app.register(helmet, {
    global: true,
  });

  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

  await app.register(cors, {
    origin: (origin, cb) => {
      if (
        !origin ||
        origin === 'null' ||
        origin.startsWith('file://') ||
        allowedOrigins.includes(origin)
      ) {
        cb(null, true);
        return;
      }
      cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(rateLimit, {
    max: env.NODE_ENV === 'production' ? 300 : 1000,
    timeWindow: '1 minute',
  });
}
