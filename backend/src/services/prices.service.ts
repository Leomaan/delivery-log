import type { Price } from '@prisma/client';
import { PricesRepository } from '../repositories/prices.repository';
import type { CreatePriceInput } from '../schemas/prices.schema';
import { NotFoundError, ValidationError } from '../shared/errors';
import { addUtcDays, parseUtcDateOnly } from '../shared/lib/date';
import { assertPositiveCents } from '../shared/lib/money';

function intervalsOverlap(
  aStart: Date,
  aEnd: Date | null,
  bStart: Date,
  bEnd: Date | null,
): boolean {
  const aStartsBeforeBEnds = bEnd === null || aStart.getTime() <= bEnd.getTime();
  const bStartsBeforeAEnds = aEnd === null || bStart.getTime() <= aEnd.getTime();
  return aStartsBeforeBEnds && bStartsBeforeAEnds;
}

export class PricesService {
  constructor(private readonly pricesRepository: PricesRepository = new PricesRepository()) {}

  async createPrice(placeId: number, input: CreatePriceInput): Promise<Price> {
    assertPositiveCents(input.unitCents, 'unitCents');

    const validFrom = parseUtcDateOnly(input.validFrom, 'validFrom');
    let validTo =
      input.validTo !== undefined && input.validTo !== null
        ? parseUtcDateOnly(input.validTo, 'validTo')
        : null;

    if (validTo !== null && validTo.getTime() < validFrom.getTime()) {
      throw new ValidationError('validTo cannot be earlier than validFrom');
    }

    const place = await this.pricesRepository.findPlaceById(placeId);
    if (!place) {
      throw new NotFoundError('Place not found');
    }

    const existingPrices = await this.pricesRepository.findAllByPlaceId(placeId);

    let updateSameDayPriceId: number | undefined;
    const closePriceUpdates: Array<{ id: number; validTo: Date }> = [];

    // If there is a future price starting after validFrom and validTo was not specified,
    // automatically cap validTo at the day before the next future price starts.
    const nextFuturePrice = existingPrices.find(
      (p) => p.validFrom.getTime() > validFrom.getTime(),
    );
    if (nextFuturePrice && validTo === null) {
      validTo = addUtcDays(nextFuturePrice.validFrom, -1);
    }

    for (const existing of existingPrices) {
      // Same start date: update that price in-place so the user can change the value on the same day
      if (existing.validFrom.getTime() === validFrom.getTime()) {
        updateSameDayPriceId = existing.id;
        continue;
      }

      // Previous price that is open or extends into the new validFrom: close it at validFrom - 1 day
      if (
        existing.validFrom.getTime() < validFrom.getTime() &&
        intervalsOverlap(validFrom, validTo, existing.validFrom, existing.validTo)
      ) {
        closePriceUpdates.push({
          id: existing.id,
          validTo: addUtcDays(validFrom, -1),
        });
      }
    }

    return this.pricesRepository.createWithOptionalClose({
      placeId,
      unitCents: input.unitCents,
      validFrom,
      validTo,
      updateSameDayPriceId,
      closePriceUpdates,
    });
  }

  async listPricesByPlace(placeId: number): Promise<Price[]> {
    const place = await this.pricesRepository.findPlaceById(placeId);
    if (!place) {
      throw new NotFoundError('Place not found');
    }

    return this.pricesRepository.findAllByPlaceId(placeId);
  }

  async getActivePriceForDate(placeId: number, dateInput: string | Date): Promise<Price> {
    const targetDate =
      typeof dateInput === 'string' ? parseUtcDateOnly(dateInput, 'date') : dateInput;

    const place = await this.pricesRepository.findPlaceById(placeId);
    if (!place) {
      throw new NotFoundError('Place not found');
    }

    const prices = await this.pricesRepository.findAllByPlaceId(placeId);
    const targetMs = targetDate.getTime();

    const matchingPrices = prices.filter((p) => {
      const fromMs = p.validFrom.getTime();
      const toMs = p.validTo ? p.validTo.getTime() : Number.POSITIVE_INFINITY;
      return fromMs <= targetMs && targetMs <= toMs;
    });

    const activePrice = matchingPrices[matchingPrices.length - 1];

    if (!activePrice) {
      throw new NotFoundError('No active price found for this place on the specified date');
    }

    return activePrice;
  }
}
