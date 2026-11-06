import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  activePriceQuerySchema,
  createPriceSchema,
  placeIdForPricesParamSchema,
} from '../schemas/prices.schema';
import { PricesService } from '../services/prices.service';

export class PricesController {
  constructor(private readonly pricesService: PricesService = new PricesService()) {}

  create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = placeIdForPricesParamSchema.parse(request.params);
    const input = createPriceSchema.parse(request.body);
    const price = await this.pricesService.createPrice(id, input);
    await reply.status(201).send(price);
  };

  list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = placeIdForPricesParamSchema.parse(request.params);
    const prices = await this.pricesService.listPricesByPlace(id);
    await reply.status(200).send({ items: prices });
  };

  getActive = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = placeIdForPricesParamSchema.parse(request.params);
    const { date } = activePriceQuerySchema.parse(request.query);
    const price = await this.pricesService.getActivePriceForDate(id, date);
    await reply.status(200).send(price);
  };
}
