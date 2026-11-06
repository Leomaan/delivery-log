import type { Place } from '@prisma/client';
import { PlacesRepository } from '../repositories/places.repository';
import type { CreatePlaceInput, ListPlacesQuery, UpdatePlaceInput } from '../schemas/places.schema';
import { NotFoundError } from '../shared/errors';

export interface PaginatedPlacesResult {
  items: Place[];
  page: number;
  limit: number;
  total: number;
}

export class PlacesService {
  constructor(private readonly placesRepository: PlacesRepository = new PlacesRepository()) {}

  async createPlace(input: CreatePlaceInput): Promise<Place> {
    return this.placesRepository.create(input.name);
  }

  async getPlaceById(id: number): Promise<Place> {
    const place = await this.placesRepository.findById(id);
    if (!place) {
      throw new NotFoundError('Place not found');
    }
    return place;
  }

  async listPlaces(query: ListPlacesQuery): Promise<PaginatedPlacesResult> {
    const skip = (query.page - 1) * query.limit;
    const { items, total } = await this.placesRepository.findManyAndCount({
      skip,
      take: query.limit,
      active: query.active,
    });

    return {
      items,
      page: query.page,
      limit: query.limit,
      total,
    };
  }

  async updatePlace(id: number, input: UpdatePlaceInput): Promise<Place> {
    await this.getPlaceById(id);
    return this.placesRepository.update(id, input);
  }

  async deactivatePlace(id: number): Promise<Place> {
    await this.getPlaceById(id);
    return this.placesRepository.update(id, { active: false });
  }
}
