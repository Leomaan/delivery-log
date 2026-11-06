import type { Place, Price } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';
import type { CreatePriceRepoInput, PricesRepository } from '../../src/repositories/prices.repository';
import { PricesService } from '../../src/services/prices.service';
import { NotFoundError, ValidationError } from '../../src/shared/errors';
import { formatUtcDateOnly } from '../../src/shared/lib/date';

export class InMemoryPricesRepository implements Pick<
  PricesRepository,
  'findPlaceById' | 'findAllByPlaceId' | 'createWithOptionalClose'
> {
  public places: Place[] = [];
  public prices: Price[] = [];
  private nextPriceId = 1;

  async findPlaceById(placeId: number): Promise<Place | null> {
    return this.places.find((p) => p.id === placeId) ?? null;
  }

  async findAllByPlaceId(placeId: number): Promise<Price[]> {
    return this.prices
      .filter((p) => p.placeId === placeId)
      .sort((a, b) => a.validFrom.getTime() - b.validFrom.getTime() || a.id - b.id);
  }

  async createWithOptionalClose(input: CreatePriceRepoInput): Promise<Price> {
    if (input.closePriceUpdates) {
      for (const closeUpdate of input.closePriceUpdates) {
        const target = this.prices.find((p) => p.id === closeUpdate.id);
        if (target) {
          target.validTo = closeUpdate.validTo;
        }
      }
    }

    if (input.updateSameDayPriceId !== undefined) {
      const existing = this.prices.find((p) => p.id === input.updateSameDayPriceId);
      if (existing) {
        existing.unitCents = input.unitCents;
        existing.validTo = input.validTo;
        return existing;
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
  }
}

describe('PricesService Unit Tests', () => {
  let repo: InMemoryPricesRepository;
  let pricesService: PricesService;

  beforeEach(() => {
    repo = new InMemoryPricesRepository();
    repo.places.push({
      id: 1,
      name: 'Prefeitura',
      active: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    pricesService = new PricesService(repo as unknown as PricesRepository);
  });

  it('closes previous open price automatically with validTo = validFrom - 1 day without overlap', async () => {
    const first = await pricesService.createPrice(1, {
      unitCents: 1800,
      validFrom: '2026-01-01',
    });

    expect(first.validTo).toBeNull();

    const second = await pricesService.createPrice(1, {
      unitCents: 2000,
      validFrom: '2026-02-01',
    });

    const allPrices = await pricesService.listPricesByPlace(1);
    expect(allPrices).toHaveLength(2);

    const updatedFirst = allPrices[0];
    expect(updatedFirst?.validTo).not.toBeNull();
    if (updatedFirst?.validTo) {
      expect(formatUtcDateOnly(updatedFirst.validTo)).toBe('2026-01-31');
    }
    expect(second.validTo).toBeNull();
  });

  it('allows changing the price on the same start date or inserting an intermediate date without overlap error', async () => {
    await pricesService.createPrice(1, {
      unitCents: 1800,
      validFrom: '2026-01-01',
    });

    // Updating the price on the exact same day (2026-01-01) updates it in-place
    const updatedSameDay = await pricesService.createPrice(1, {
      unitCents: 1900,
      validFrom: '2026-01-01',
    });
    expect(updatedSameDay.unitCents).toBe(1900);

    // Adding a price in February (2026-02-01)
    await pricesService.createPrice(1, {
      unitCents: 2100,
      validFrom: '2026-02-01',
    });

    // Inserting an intermediate price on 2026-01-15 automatically closes 2026-01-01 at 2026-01-14
    // and caps the 2026-01-15 price at 2026-01-31!
    const midJan = await pricesService.createPrice(1, {
      unitCents: 2000,
      validFrom: '2026-01-15',
    });

    expect(midJan.unitCents).toBe(2000);
    expect(midJan.validTo).not.toBeNull();
    if (midJan.validTo) {
      expect(formatUtcDateOnly(midJan.validTo)).toBe('2026-01-31');
    }
  });

  it('returns the exact active price on every validity boundary and throws NotFoundError on gaps', async () => {
    await pricesService.createPrice(1, {
      unitCents: 1800,
      validFrom: '2026-01-01',
      validTo: '2026-01-15',
    });

    await pricesService.createPrice(1, {
      unitCents: 1950,
      validFrom: '2026-01-20',
    });

    await pricesService.createPrice(1, {
      unitCents: 2100,
      validFrom: '2026-02-01',
    });

    await expect(pricesService.getActivePriceForDate(1, '2025-12-31')).rejects.toThrow(
      NotFoundError,
    );

    const pStart1 = await pricesService.getActivePriceForDate(1, '2026-01-01');
    expect(pStart1.unitCents).toBe(1800);

    const pEnd1 = await pricesService.getActivePriceForDate(1, '2026-01-15');
    expect(pEnd1.unitCents).toBe(1800);

    await expect(pricesService.getActivePriceForDate(1, '2026-01-16')).rejects.toThrow(
      NotFoundError,
    );
    await expect(pricesService.getActivePriceForDate(1, '2026-01-19')).rejects.toThrow(
      NotFoundError,
    );

    const pStart2 = await pricesService.getActivePriceForDate(1, '2026-01-20');
    expect(pStart2.unitCents).toBe(1950);

    const pEnd2 = await pricesService.getActivePriceForDate(1, '2026-01-31');
    expect(pEnd2.unitCents).toBe(1950);

    const pStart3 = await pricesService.getActivePriceForDate(1, '2026-02-01');
    expect(pStart3.unitCents).toBe(2100);

    const pFuture = await pricesService.getActivePriceForDate(1, '2026-08-15');
    expect(pFuture.unitCents).toBe(2100);
  });

  it('validates validTo >= validFrom and positive integer cents', async () => {
    await expect(
      pricesService.createPrice(1, {
        unitCents: 1800,
        validFrom: '2026-02-10',
        validTo: '2026-02-01',
      }),
    ).rejects.toThrow(ValidationError);

    await expect(
      pricesService.createPrice(1, {
        unitCents: 0,
        validFrom: '2026-02-10',
      }),
    ).rejects.toThrow(ValidationError);
  });
});
