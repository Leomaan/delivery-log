import type { Place } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';
import type {
  ListPlacesRepoParams,
  PlacesRepository,
} from '../../src/repositories/places.repository';
import { PlacesService } from '../../src/services/places.service';
import { NotFoundError } from '../../src/shared/errors';

export class InMemoryPlacesRepository implements Pick<
  PlacesRepository,
  'create' | 'findById' | 'findManyAndCount' | 'update' | 'deleteById'
> {
  public places: Place[] = [];
  private nextId = 1;

  async create(name: string): Promise<Place> {
    const place: Place = {
      id: this.nextId++,
      name,
      active: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    this.places.push(place);
    return place;
  }

  async findById(id: number): Promise<Place | null> {
    return this.places.find((p) => p.id === id) ?? null;
  }

  async findManyAndCount(params: ListPlacesRepoParams): Promise<{ items: Place[]; total: number }> {
    const filtered =
      params.active !== undefined
        ? this.places.filter((p) => p.active === params.active)
        : [...this.places];

    const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
    const items = sorted.slice(params.skip, params.skip + params.take);

    return { items, total: filtered.length };
  }

  async update(id: number, data: { name?: string; active?: boolean }): Promise<Place> {
    const place = this.places.find((p) => p.id === id);
    if (!place) {
      throw new NotFoundError('Place not found');
    }
    if (data.name !== undefined) {
      place.name = data.name;
    }
    if (data.active !== undefined) {
      place.active = data.active;
    }
    return place;
  }

  async deleteById(id: number): Promise<void> {
    const idx = this.places.findIndex((p) => p.id === id);
    if (idx === -1) {
      throw new NotFoundError('Place not found');
    }
    this.places.splice(idx, 1);
  }
}

describe('PlacesService Unit Tests', () => {
  let repo: InMemoryPlacesRepository;
  let placesService: PlacesService;

  beforeEach(() => {
    repo = new InMemoryPlacesRepository();
    placesService = new PlacesService(repo as unknown as PlacesRepository);
  });

  it('creates, updates, lists with pagination, and deactivates places instead of deleting', async () => {
    const placeA = await placesService.createPlace({ name: 'Obra Centro' });
    const placeB = await placesService.createPlace({ name: 'Oficina Norte' });

    expect(placeA.active).toBe(true);
    expect(placeB.active).toBe(true);

    const deactivated = await placesService.deactivatePlace(placeA.id);
    expect(deactivated.active).toBe(false);
    expect(repo.places).toHaveLength(2);

    const activeOnly = await placesService.listPlaces({
      page: 1,
      limit: 10,
      active: true,
    });

    expect(activeOnly.total).toBe(1);
    expect(activeOnly.items[0]?.name).toBe('Oficina Norte');

    await placesService.deletePlace(placeA.id);
    expect(repo.places).toHaveLength(1);
  });

  it('throws NotFoundError when updating, deactivating, or deleting non-existent place', async () => {
    await expect(placesService.getPlaceById(999)).rejects.toThrow(NotFoundError);
    await expect(placesService.updatePlace(999, { name: 'Novo Nome' })).rejects.toThrow(
      NotFoundError,
    );
    await expect(placesService.deactivatePlace(999)).rejects.toThrow(NotFoundError);
    await expect(placesService.deletePlace(999)).rejects.toThrow(NotFoundError);
  });
});
