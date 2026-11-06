import type { FastifyInstance } from 'fastify';
import { PricesController } from '../controllers/prices.controller';
import type { PricesService } from '../services/prices.service';

export interface PricesRoutesOptions {
  pricesService?: PricesService;
}

export async function pricesRoutes(
  app: FastifyInstance,
  options: PricesRoutesOptions = {},
): Promise<void> {
  const controller = new PricesController(options.pricesService);

  app.addHook('onRequest', app.authenticate);

  app.post('/:id/prices', controller.create);
  app.get('/:id/prices', controller.list);
  app.get('/:id/prices/active', controller.getActive);
}
