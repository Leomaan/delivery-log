import type { FastifyReply, FastifyRequest } from 'fastify';
import { reportSummaryQuerySchema } from '../schemas/reports.schema';
import { ReportsService } from '../services/reports.service';

export class ReportsController {
  constructor(private readonly reportsService: ReportsService = new ReportsService()) {}

  summary = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = reportSummaryQuerySchema.parse(request.query);
    const result = await this.reportsService.getSummary(query);
    await reply.status(200).send(result);
  };
}
