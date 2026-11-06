import { randomUUID } from 'node:crypto';
import type { FastifyServerOptions } from 'fastify';
import pino from 'pino';
import { env } from '../../config/env';

const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'password',
  '*.password',
  'token',
  '*.token',
  'refreshToken',
  '*.refreshToken',
];

export function getLoggerOptions(): FastifyServerOptions['logger'] {
  if (env.NODE_ENV === 'test') {
    return false;
  }

  return {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    redact: {
      paths: REDACT_PATHS,
      censor: '[REDACTED]',
    },
    ...(env.NODE_ENV === 'development'
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          },
        }
      : {}),
  };
}

export function generateRequestId(req: { headers: Record<string, string | string[] | undefined> }): string {
  const existingId = req.headers['x-request-id'];
  if (typeof existingId === 'string' && existingId.trim().length > 0) {
    return existingId.trim();
  }
  return randomUUID();
}

export const logger = pino(
  env.NODE_ENV === 'test'
    ? { level: 'silent' }
    : {
        level: env.NODE_ENV === 'production' ? 'info' : 'debug',
        redact: {
          paths: REDACT_PATHS,
          censor: '[REDACTED]',
        },
      },
);
