import type { FastifyInstance } from 'fastify';
import type { AuthService } from '../services/auth.service';
import type { DeliveriesService } from '../services/deliveries.service';
import type { PlacesService } from '../services/places.service';
import type { PricesService } from '../services/prices.service';
import type { ReportsService } from '../services/reports.service';
import { authRoutes } from './auth.routes';
import { deliveriesRoutes } from './deliveries.routes';
import { placesRoutes } from './places.routes';
import { pricesRoutes } from './prices.routes';
import { reportsRoutes } from './reports.routes';

export interface AppRoutesOptions {
  authService?: AuthService;
  placesService?: PlacesService;
  pricesService?: PricesService;
  deliveriesService?: DeliveriesService;
  reportsService?: ReportsService;
}

export async function registerRoutes(
  app: FastifyInstance,
  options: AppRoutesOptions = {},
): Promise<void> {
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
}
