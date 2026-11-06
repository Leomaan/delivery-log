import type { Delivery, Place, Price } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';
import type {
  CreateDeliveryInTxParams,
  DeliveriesRepository,
  ListDeliveriesRepoParams,
} from '../../src/repositories/deliveries.repository';
import type { CreatePriceRepoInput, PricesRepository } from '../../src/repositories/prices.repository';
import { DeliveriesService } from '../../src/services/deliveries.service';
import { PricesService } from '../../src/services/prices.service';
import { ConflictError, NotFoundError, ValidationError } from '../../src/shared/errors';

export class InMemoryDeliveriesStore {
  public places: Place[] = [];
  public prices: Price[] = [];
  public deliveries: Delivery[] = [];
  private nextPriceId = 1;
  private nextDeliveryId = 1;

  public asPricesRepository(): Pick<
    PricesRepository,
    'findPlaceById' | 'findAllByPlaceId' | 'createWithOptionalClose'
  > {
    return {
      findPlaceById: async (placeId: number): Promise<Place | null> => {
        return this.places.find((p) => p.id === placeId) ?? null;
      },
      findAllByPlaceId: async (placeId: number): Promise<Price[]> => {
        return this.prices
          .filter((p) => p.placeId === placeId)
          .sort((a, b) => a.validFrom.getTime() - b.validFrom.getTime() || a.id - b.id);
      },
      createWithOptionalClose: async (input: CreatePriceRepoInput): Promise<Price> => {
        if (input.closePriceUpdate) {
          const target = this.prices.find((p) => p.id === input.closePriceUpdate?.id);
          if (target) {
            target.validTo = input.closePriceUpdate.validTo;
          }
        }

        const price: Price = {
          id: this.nextPriceId++,
          placeId: input.placeId,
          unitCents: input.unitCents,
          validFrom: input.validFrom,
          validTo: input.validTo,
        };
        this.prices.push(price);
        return price;
      },
    };
  }

  public asDeliveriesRepository(): Pick<
    DeliveriesRepository,
    'createWithFrozenPrice' | 'findById' | 'findManyAndCount' | 'cancel'
  > {
    return {
      createWithFrozenPrice: async (params: CreateDeliveryInTxParams): Promise<Delivery> => {
        const place = this.places.find((p) => p.id === params.placeId) ?? null;
        const targetMs = params.date.getTime();

        const activePrice =
          this.prices
            .filter((p) => {
              if (p.placeId !== params.placeId) return false;
              const fromMs = p.validFrom.getTime();
              const toMs = p.validTo ? p.validTo.getTime() : Number.POSITIVE_INFINITY;
              return fromMs <= targetMs && targetMs <= toMs;
            })
            .sort((a, b) => b.validFrom.getTime() - a.validFrom.getTime())[0] ?? null;

        const { unitCents, totalCents } = params.resolvePriceAndCreate({
          place,
          activePrice,
        });

        const delivery: Delivery = {
          id: this.nextDeliveryId++,
          placeId: params.placeId,
          createdBy: params.createdBy,
          date: params.date,
          quantity: params.quantity,
          unitCents,
          totalCents,
          canceledAt: null,
          cancelReason: null,
          createdAt: new Date('2026-01-10T12:00:00.000Z'),
        };

        this.deliveries.push(delivery);
        return delivery;
      },

      findById: async (id: number): Promise<Delivery | null> => {
        return this.deliveries.find((d) => d.id === id) ?? null;
      },

      findManyAndCount: async (
        params: ListDeliveriesRepoParams,
      ): Promise<{ items: Delivery[]; total: number }> => {
        const filtered = this.deliveries.filter((d) => {
          if (params.placeId !== undefined && d.placeId !== params.placeId) return false;
          if (!params.includeCanceled && d.canceledAt !== null) return false;
          if (params.from && d.date.getTime() < params.from.getTime()) return false;
          if (params.to && d.date.getTime() > params.to.getTime()) return false;
          return true;
        });

        const sorted = filtered.sort(
          (a, b) => b.date.getTime() - a.date.getTime() || b.id - a.id,
        );
        const items = sorted.slice(params.skip, params.skip + params.take);

        return { items, total: filtered.length };
      },

      cancel: async (id: number, reason: string, canceledAt: Date): Promise<Delivery> => {
        const delivery = this.deliveries.find((d) => d.id === id);
        if (!delivery) {
          throw new NotFoundError('Delivery not found');
        }
        delivery.canceledAt = canceledAt;
        delivery.cancelReason = reason;
        return delivery;
      },
    };
  }
}

describe('DeliveriesService Unit Tests', () => {
  let store: InMemoryDeliveriesStore;
  let pricesService: PricesService;
  let deliveriesService: DeliveriesService;

  beforeEach(() => {
    store = new InMemoryDeliveriesStore();
    store.places.push({
      id: 1,
      name: 'Obra Centro',
      active: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    pricesService = new PricesService(store.asPricesRepository() as unknown as PricesRepository);
    deliveriesService = new DeliveriesService(
      store.asDeliveriesRepository() as unknown as DeliveriesRepository,
    );
  });

  it('freezes unitCents and totalCents at creation time and does NOT change old deliveries when price increases', async () => {
    await pricesService.createPrice(1, {
      unitCents: 1800,
      validFrom: '2026-01-01',
    });

    const janDelivery = await deliveriesService.createDelivery(1, {
      placeId: 1,
      date: '2026-01-15',
      quantity: 10,
    });

    expect(janDelivery.unitCents).toBe(1800);
    expect(janDelivery.totalCents).toBe(18000);

    // Price increases in February to R$ 22,00 (2200 cents)
    await pricesService.createPrice(1, {
      unitCents: 2200,
      validFrom: '2026-02-01',
    });

    const febDelivery = await deliveriesService.createDelivery(1, {
      placeId: 1,
      date: '2026-02-05',
      quantity: 10,
    });

    expect(febDelivery.unitCents).toBe(2200);
    expect(febDelivery.totalCents).toBe(22000);

    // Verify January delivery remains frozen at 1800 / 18000
    const listResult = await deliveriesService.listDeliveries({
      page: 1,
      limit: 20,
      placeId: 1,
      includeCanceled: false,
    });

    const storedJan = listResult.items.find((d) => d.id === janDelivery.id);
    expect(storedJan?.unitCents).toBe(1800);
    expect(storedJan?.totalCents).toBe(18000);
    expect(listResult.totalQuantity).toBe(20);
    expect(listResult.totalDeliveredCents).toBe(40000);
  });

  it('throws clear ValidationError if no active price exists on delivery date', async () => {
    await pricesService.createPrice(1, {
      unitCents: 1800,
      validFrom: '2026-02-01',
    });

    await expect(
      deliveriesService.createDelivery(1, {
        placeId: 1,
        date: '2026-01-15',
        quantity: 5,
      }),
    ).rejects.toThrowError(/No active price found/);
  });

  it('rejects delivery for non-existent or inactive place', async () => {
    await expect(
      deliveriesService.createDelivery(1, {
        placeId: 999,
        date: '2026-01-15',
        quantity: 5,
      }),
    ).rejects.toThrow(NotFoundError);

    const place = store.places[0];
    if (place) {
      place.active = false;
    }

    await expect(
      deliveriesService.createDelivery(1, {
        placeId: 1,
        date: '2026-01-15',
        quantity: 5,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('cancels delivery logically with reason, excludes canceled from totals, and prevents double cancel', async () => {
    await pricesService.createPrice(1, {
      unitCents: 2000,
      validFrom: '2026-01-01',
    });

    const d1 = await deliveriesService.createDelivery(1, {
      placeId: 1,
      date: '2026-01-10',
      quantity: 5,
    });

    await deliveriesService.createDelivery(1, {
      placeId: 1,
      date: '2026-01-11',
      quantity: 8,
    });

    const canceled = await deliveriesService.cancelDelivery(d1.id, {
      reason: 'Duplicate entry registered by mistake',
    });

    expect(canceled.canceledAt).not.toBeNull();
    expect(canceled.cancelReason).toBe('Duplicate entry registered by mistake');
    expect(store.deliveries).toHaveLength(2); // Not physically deleted

    // Cannot cancel twice
    await expect(
      deliveriesService.cancelDelivery(d1.id, { reason: 'Second cancel' }),
    ).rejects.toThrow(ConflictError);

    // Default listing excludes canceled deliveries
    const activeList = await deliveriesService.listDeliveries({
      page: 1,
      limit: 20,
      placeId: 1,
      includeCanceled: false,
    });

    expect(activeList.total).toBe(1);
    expect(activeList.totalQuantity).toBe(8);
    expect(activeList.totalDeliveredCents).toBe(16000);

    // Even when includeCanceled=true, canceled deliveries do not enter active totals
    const allList = await deliveriesService.listDeliveries({
      page: 1,
      limit: 20,
      placeId: 1,
      includeCanceled: true,
    });

    expect(allList.total).toBe(2);
    expect(allList.totalQuantity).toBe(8);
    expect(allList.totalDeliveredCents).toBe(16000);
  });
});
