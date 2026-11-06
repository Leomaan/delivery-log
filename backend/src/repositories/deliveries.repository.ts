import type { Delivery, Place, Price, Prisma, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../shared/lib/prisma';

export interface CreateDeliveryInTxParams {
  placeId: number;
  createdBy: number;
  date: Date;
  quantity: number;
  resolvePriceAndCreate: (context: {
    place: Place | null;
    activePrice: Price | null;
  }) => {
    unitCents: number;
    totalCents: number;
  };
}

export interface ListDeliveriesRepoParams {
  skip: number;
  take: number;
  placeId?: number;
  from?: Date;
  to?: Date;
  includeCanceled: boolean;
}

export class DeliveriesRepository {
  constructor(private readonly db: PrismaClient = defaultPrisma) {}

  async createWithFrozenPrice(params: CreateDeliveryInTxParams): Promise<Delivery> {
    return this.db.$transaction(async (tx) => {
      const place = await tx.place.findUnique({
        where: { id: params.placeId },
      });

      const activePrice = await tx.price.findFirst({
        where: {
          placeId: params.placeId,
          validFrom: { lte: params.date },
          OR: [{ validTo: null }, { validTo: { gte: params.date } }],
        },
        orderBy: [{ validFrom: 'desc' }, { id: 'desc' }],
      });

      const { unitCents, totalCents } = params.resolvePriceAndCreate({
        place,
        activePrice,
      });

      return tx.delivery.create({
        data: {
          placeId: params.placeId,
          createdBy: params.createdBy,
          date: params.date,
          quantity: params.quantity,
          unitCents,
          totalCents,
        },
      });
    });
  }

  async findById(id: number): Promise<Delivery | null> {
    return this.db.delivery.findUnique({
      where: { id },
    });
  }

  async findManyAndCount(
    params: ListDeliveriesRepoParams,
  ): Promise<{ items: Delivery[]; total: number }> {
    const where: Prisma.DeliveryWhereInput = {
      ...(params.placeId !== undefined ? { placeId: params.placeId } : {}),
      ...(!params.includeCanceled ? { canceledAt: null } : {}),
      ...(params.from !== undefined || params.to !== undefined
        ? {
            date: {
              ...(params.from !== undefined ? { gte: params.from } : {}),
              ...(params.to !== undefined ? { lte: params.to } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await this.db.$transaction([
      this.db.delivery.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
      }),
      this.db.delivery.count({ where }),
    ]);

    return { items, total };
  }

  async updateQuantity(id: number, quantity: number, totalCents: number): Promise<Delivery> {
    return this.db.delivery.update({
      where: { id },
      data: {
        quantity,
        totalCents,
      },
    });
  }

  async cancel(id: number, reason: string, canceledAt: Date): Promise<Delivery> {
    return this.db.delivery.update({
      where: { id },
      data: {
        canceledAt,
        cancelReason: reason,
      },
    });
  }
}
