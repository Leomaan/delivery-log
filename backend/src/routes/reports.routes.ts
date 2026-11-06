import type { FastifyInstance } from 'fastify';
import { ReportsController } from '../controllers/reports.controller';
import type { ReportsService } from '../services/reports.service';

export interface ReportsRoutesOptions {
  reportsService?: ReportsService;
}

export async function reportsRoutes(
  app: FastifyInstance,
  options: ReportsRoutesOptions = {},
): Promise<void> {
  const controller = new ReportsController(options.reportsService);

  app.addHook('onRequest', app.authenticate);

  app.get('/summary', controller.summary);
}
