import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../../config/env';
import { UnauthorizedError } from '../errors';

export async function registerAuthPlugins(app: FastifyInstance): Promise<void> {
  await app.register(cookie);

  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: '15m',
    },
  });

  app.decorate('authenticate', async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  });
}
