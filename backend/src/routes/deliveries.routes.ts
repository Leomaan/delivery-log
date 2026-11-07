import type { FastifyInstance } from 'fastify';
import { DeliveriesController } from '../controllers/deliveries.controller';
import type { DeliveriesService } from '../services/deliveries.service';

export interface DeliveriesRoutesOptions {
  deliveriesService?: DeliveriesService;
}

export async function deliveriesRoutes(
  app: FastifyInstance,
  options: DeliveriesRoutesOptions = {},
): Promise<void> {
  const controller = new DeliveriesController(options.deliveriesService);

  app.addHook('onRequest', app.authenticate);

  app.post('/', controller.create);
  app.get('/', controller.list);
  app.patch('/:id', controller.update);
  app.delete('/:id', controller.delete);
}
