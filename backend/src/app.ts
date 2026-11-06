import Fastify, { type FastifyInstance } from 'fastify';
import { type AppRoutesOptions, registerRoutes } from './routes';
import { errorHandler, NotFoundError } from './shared/errors';
import { generateRequestId, getLoggerOptions } from './shared/lib/logger';
import { registerAuthPlugins } from './shared/plugins/auth';
import { registerSecurityPlugins } from './shared/plugins/security';
import { registerDocsPlugins } from './shared/plugins/swagger';

export type BuildAppOptions = AppRoutesOptions;

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: getLoggerOptions(),
    genReqId: generateRequestId,
    requestIdHeader: 'x-request-id',
  });

  app.addHook('onSend', async (request, reply) => {
    reply.header('x-request-id', request.id);
  });

  await registerSecurityPlugins(app);
  await registerAuthPlugins(app);
  await registerDocsPlugins(app);

  app.setErrorHandler(errorHandler);

  app.setNotFoundHandler((_request, _reply) => {
    throw new NotFoundError('Route not found');
  });

  await registerRoutes(app, options);

  return app;
}
