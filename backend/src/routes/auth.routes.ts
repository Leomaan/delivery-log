import type { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/auth.controller';
import type { AuthService } from '../services/auth.service';

export interface AuthRoutesOptions {
  authService?: AuthService;
}

export async function authRoutes(
  app: FastifyInstance,
  options: AuthRoutesOptions = {},
): Promise<void> {
  const controller = new AuthController(options.authService);

  app.post(
    '/login',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    },
    controller.login,
  );

  app.post('/refresh', controller.refresh);

  app.post('/logout', controller.logout);

  app.get(
    '/me',
    {
      onRequest: [app.authenticate],
    },
    controller.me,
  );
}
