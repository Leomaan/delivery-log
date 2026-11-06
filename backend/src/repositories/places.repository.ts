import type { Place, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../shared/lib/prisma';

export interface ListPlacesRepoParams {
  skip: number;
  take: number;
  active?: boolean;
}

export class PlacesRepository {
  constructor(private readonly db: PrismaClient = defaultPrisma) {}

  async create(name: string): Promise<Place> {
    return this.db.place.create({
      data: {
        name,
        active: true,
      },
    });
  }

  async findById(id: number): Promise<Place | null> {
    return this.db.place.findUnique({
      where: { id },
    });
  }

  async findManyAndCount(params: ListPlacesRepoParams): Promise<{ items: Place[]; total: number }> {
    const where = params.active !== undefined ? { active: params.active } : {};

    const [items, total] = await this.db.$transaction([
      this.db.place.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      }),
      this.db.place.count({ where }),
    ]);

    return { items, total };
  }

  async update(
    id: number,
    data: { name?: string; active?: boolean },
  ): Promise<Place> {
    return this.db.place.update({
      where: { id },
      data,
    });
  }
}
