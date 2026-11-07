import type { Delivery, Place, Prisma, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../shared/lib/prisma';

export interface FindActiveDeliveriesReportParams {
  placeId?: number;
  from?: Date;
  to?: Date;
}

export type DeliveryWithPlace = Delivery & {
  place: Pick<Place, 'id' | 'name' | 'active'>;
};

export class ReportsRepository {
  constructor(private readonly db: PrismaClient = defaultPrisma) {}

  async findActiveDeliveries(
    params: FindActiveDeliveriesReportParams,
  ): Promise<DeliveryWithPlace[]> {
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

    return this.db.delivery.findMany({
      where,
      include: {
        place: {
          select: {
            id: true,
            name: true,
            active: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { id: 'asc' }],
    });
  }
}
