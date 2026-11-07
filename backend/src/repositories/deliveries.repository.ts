import type { Delivery, Place, Price, Prisma, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../shared/lib/prisma';

export interface CreateDeliveryInTxParams {
  placeId: number;
  createdBy: number;
  date: Date;
  quantity: number;
  resolvePriceAndCreate: (context: { place: Place | null; activePrice: Price | null }) => {
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

  async findManyAndCount(params: ListDeliveriesRepoParams): Promise<{
    items: Delivery[];
    total: number;
    totalQuantity: number;
    totalDeliveredCents: number;
  }> {
    const where: Prisma.DeliveryWhereInput = {
      ...(params.placeId !== undefined ? { placeId: params.placeId } : {}),
      ...(params.from !== undefined || params.to !== undefined
        ? {
            date: {
              ...(params.from !== undefined ? { gte: params.from } : {}),
              ...(params.to !== undefined ? { lte: params.to } : {}),
            },
          }
        : {}),
    };

    const [items, total, aggregate] = await this.db.$transaction([
      this.db.delivery.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
      }),
      this.db.delivery.count({ where }),
      this.db.delivery.aggregate({
        where,
        _sum: {
          quantity: true,
          totalCents: true,
        },
      }),
    ]);

    return {
      items,
      total,
      totalQuantity: aggregate._sum.quantity ?? 0,
      totalDeliveredCents: aggregate._sum.totalCents ?? 0,
    };
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

  async deleteById(id: number): Promise<void> {
    await this.db.delivery.delete({
      where: { id },
    });
  }
}
