import Fastify, { type FastifyInstance } from 'fastify';
import { authRoutes } from './routes/auth.routes';
import { deliveriesRoutes } from './routes/deliveries.routes';
import { placesRoutes } from './routes/places.routes';
import { pricesRoutes } from './routes/prices.routes';
import { reportsRoutes } from './routes/reports.routes';
import type { AuthService } from './services/auth.service';
import type { DeliveriesService } from './services/deliveries.service';
import type { PlacesService } from './services/places.service';
import type { PricesService } from './services/prices.service';
import type { ReportsService } from './services/reports.service';
import { errorHandler, NotFoundError } from './shared/errors';
import { generateRequestId, getLoggerOptions } from './shared/lib/logger';
import { registerAuthPlugins } from './shared/plugins/auth';
import { registerSecurityPlugins } from './shared/plugins/security';
import { registerDocsPlugins } from './shared/plugins/swagger';

export interface BuildAppOptions {
  authService?: AuthService;
  placesService?: PlacesService;
  pricesService?: PricesService;
  deliveriesService?: DeliveriesService;
  reportsService?: ReportsService;
}

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

  app.get('/health', async () => {
    return { status: 'ok' };
  });

  await app.register(
    async (api) => {
      api.get('/health', async () => {
        return { status: 'ok' };
      });

      await api.register(authRoutes, {
        prefix: '/auth',
        authService: options.authService,
      });

      await api.register(placesRoutes, {
        prefix: '/places',
        placesService: options.placesService,
      });

      await api.register(pricesRoutes, {
        prefix: '/places',
        pricesService: options.pricesService,
      });

      await api.register(deliveriesRoutes, {
        prefix: '/deliveries',
        deliveriesService: options.deliveriesService,
      });

      await api.register(reportsRoutes, {
        prefix: '/reports',
        reportsService: options.reportsService,
      });
    },
    { prefix: '/api/v1' },
  );

  return app;
}
