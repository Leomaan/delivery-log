import type { Delivery } from '@prisma/client';
import { DeliveriesRepository } from '../repositories/deliveries.repository';
import type {
  CancelDeliveryInput,
  CreateDeliveryInput,
  ListDeliveriesQuery,
  UpdateDeliveryInput,
} from '../schemas/deliveries.schema';
import { ConflictError, NotFoundError, ValidationError } from '../shared/errors';
import { parseUtcDateOnly } from '../shared/lib/date';
import { calculateDeliveryTotalCents } from '../shared/lib/money';

export interface PaginatedDeliveriesResult {
  items: Delivery[];
  page: number;
  limit: number;
  total: number;
  totalQuantity: number;
  totalDeliveredCents: number;
}

export class DeliveriesService {
  constructor(
    private readonly deliveriesRepository: DeliveriesRepository = new DeliveriesRepository(),
  ) {}

  async createDelivery(createdBy: number, input: CreateDeliveryInput): Promise<Delivery> {
    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      throw new ValidationError('quantity must be a positive integer');
    }

    const deliveryDate = parseUtcDateOnly(input.date, 'date');

    return this.deliveriesRepository.createWithFrozenPrice({
      placeId: input.placeId,
      createdBy,
      date: deliveryDate,
      quantity: input.quantity,
      resolvePriceAndCreate: ({ place, activePrice }) => {
        if (!place) {
          throw new NotFoundError('Place not found');
        }

        if (!place.active) {
          throw new ValidationError('Cannot register delivery for an inactive place');
        }

        if (!activePrice) {
          throw new ValidationError(
            'No active price found for this place on the specified delivery date',
          );
        }

        const unitCents = activePrice.unitCents;
        const totalCents = calculateDeliveryTotalCents(input.quantity, unitCents);

        return { unitCents, totalCents };
      },
    });
  }

  async listDeliveries(query: ListDeliveriesQuery): Promise<PaginatedDeliveriesResult> {
    const fromDate = query.from !== undefined ? parseUtcDateOnly(query.from, 'from') : undefined;
    const toDate = query.to !== undefined ? parseUtcDateOnly(query.to, 'to') : undefined;

    if (fromDate && toDate && toDate.getTime() < fromDate.getTime()) {
      throw new ValidationError('to date cannot be earlier than from date');
    }

    const skip = (query.page - 1) * query.limit;

    const { items, total } = await this.deliveriesRepository.findManyAndCount({
      skip,
      take: query.limit,
      placeId: query.placeId,
      from: fromDate,
      to: toDate,
      includeCanceled: query.includeCanceled,
    });

    const activeItems = items.filter((item) => item.canceledAt === null);
    const totalQuantity = activeItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalDeliveredCents = activeItems.reduce((sum, item) => sum + item.totalCents, 0);

    return {
      items,
      page: query.page,
      limit: query.limit,
      total,
      totalQuantity,
      totalDeliveredCents,
    };
  }

  async updateDelivery(id: number, input: UpdateDeliveryInput): Promise<Delivery> {
    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      throw new ValidationError('quantity must be a positive integer');
    }

    const existing = await this.deliveriesRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Delivery not found');
    }

    if (existing.canceledAt !== null) {
      throw new ConflictError('Cannot edit a canceled delivery');
    }

    const totalCents = calculateDeliveryTotalCents(input.quantity, existing.unitCents);
    return this.deliveriesRepository.updateQuantity(id, input.quantity, totalCents);
  }

  async cancelDelivery(id: number, input: CancelDeliveryInput): Promise<Delivery> {
    const existing = await this.deliveriesRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Delivery not found');
    }

    if (existing.canceledAt !== null) {
      throw new ConflictError('Delivery is already canceled');
    }

    return this.deliveriesRepository.cancel(id, input.reason, new Date());
  }
}
