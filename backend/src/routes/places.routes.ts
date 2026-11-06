import type { FastifyInstance } from 'fastify';
import { PlacesController } from '../controllers/places.controller';
import type { PlacesService } from '../services/places.service';

export interface PlacesRoutesOptions {
  placesService?: PlacesService;
}

export async function placesRoutes(
  app: FastifyInstance,
  options: PlacesRoutesOptions = {},
): Promise<void> {
  const controller = new PlacesController(options.placesService);

  app.addHook('onRequest', app.authenticate);

  app.post('/', controller.create);
  app.get('/', controller.list);
  app.get('/:id', controller.getById);
  app.patch('/:id', controller.update);
  app.post('/:id/deactivate', controller.deactivate);
}
