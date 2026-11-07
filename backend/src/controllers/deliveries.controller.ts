import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  createDeliverySchema,
  deliveryIdParamSchema,
  listDeliveriesQuerySchema,
  updateDeliverySchema,
} from '../schemas/deliveries.schema';
import { DeliveriesService } from '../services/deliveries.service';

export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService = new DeliveriesService()) {}

  create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const input = createDeliverySchema.parse(request.body);
    const delivery = await this.deliveriesService.createDelivery(request.user.sub, input);
    await reply.status(201).send(delivery);
  };

  list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = listDeliveriesQuerySchema.parse(request.query);
    const result = await this.deliveriesService.listDeliveries(query);
    await reply.status(200).send(result);
  };

  update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = deliveryIdParamSchema.parse(request.params);
    const input = updateDeliverySchema.parse(request.body);
    const delivery = await this.deliveriesService.updateDelivery(id, input);
    await reply.status(200).send(delivery);
  };

  delete = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = deliveryIdParamSchema.parse(request.params);
    await this.deliveriesService.deleteDelivery(id);
    await reply.status(204).send();
  };
}
