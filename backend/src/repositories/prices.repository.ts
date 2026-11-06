import type { Place, Price, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../shared/lib/prisma';

export interface CreatePriceRepoInput {
  placeId: number;
  unitCents: number;
  validFrom: Date;
  validTo: Date | null;
  closePriceUpdate?: {
    id: number;
    validTo: Date;
  };
}

export class PricesRepository {
  constructor(private readonly db: PrismaClient = defaultPrisma) {}

  async findPlaceById(placeId: number): Promise<Place | null> {
    return this.db.place.findUnique({
      where: { id: placeId },
    });
  }

  async findAllByPlaceId(placeId: number): Promise<Price[]> {
    return this.db.price.findMany({
      where: { placeId },
      orderBy: [{ validFrom: 'asc' }, { id: 'asc' }],
    });
  }

  async createWithOptionalClose(input: CreatePriceRepoInput): Promise<Price> {
    return this.db.$transaction(async (tx) => {
      if (input.closePriceUpdate) {
        await tx.price.update({
          where: { id: input.closePriceUpdate.id },
          data: { validTo: input.closePriceUpdate.validTo },
        });
      }

      return tx.price.create({
        data: {
          placeId: input.placeId,
          unitCents: input.unitCents,
          validFrom: input.validFrom,
          validTo: input.validTo,
        },
      });
    });
  }
}
