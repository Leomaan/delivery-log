import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  createPlaceSchema,
  listPlacesQuerySchema,
  placeIdParamSchema,
  updatePlaceSchema,
} from '../schemas/places.schema';
import { PlacesService } from '../services/places.service';

export class PlacesController {
  constructor(private readonly placesService: PlacesService = new PlacesService()) {}

  create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const input = createPlaceSchema.parse(request.body);
    const place = await this.placesService.createPlace(input);
    await reply.status(201).send(place);
  };

  list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = listPlacesQuerySchema.parse(request.query);
    const result = await this.placesService.listPlaces(query);
    await reply.status(200).send(result);
  };

  getById = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = placeIdParamSchema.parse(request.params);
    const place = await this.placesService.getPlaceById(id);
    await reply.status(200).send(place);
  };

  update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = placeIdParamSchema.parse(request.params);
    const input = updatePlaceSchema.parse(request.body);
    const place = await this.placesService.updatePlace(id, input);
    await reply.status(200).send(place);
  };

  deactivate = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = placeIdParamSchema.parse(request.params);
    const place = await this.placesService.deactivatePlace(id);
    await reply.status(200).send(place);
  };
}
