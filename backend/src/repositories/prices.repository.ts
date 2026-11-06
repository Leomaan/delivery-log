import type { Place, Price, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../shared/lib/prisma';

export interface CreatePriceRepoInput {
  placeId: number;
  unitCents: number;
  validFrom: Date;
  validTo: Date | null;
  updateSameDayPriceId?: number;
  closePriceUpdates?: Array<{
    id: number;
    validTo: Date;
  }>;
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
      if (input.closePriceUpdates && input.closePriceUpdates.length > 0) {
        for (const closeUpdate of input.closePriceUpdates) {
          await tx.price.update({
            where: { id: closeUpdate.id },
            data: { validTo: closeUpdate.validTo },
          });
        }
      }

      if (input.updateSameDayPriceId !== undefined) {
        return tx.price.update({
          where: { id: input.updateSameDayPriceId },
          data: {
            unitCents: input.unitCents,
            validTo: input.validTo,
          },
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
