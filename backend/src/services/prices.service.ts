import type { Price } from '@prisma/client';
import { PricesRepository } from '../repositories/prices.repository';
import type { CreatePriceInput } from '../schemas/prices.schema';
import { ConflictError, NotFoundError, ValidationError } from '../shared/errors';
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
    const validTo =
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

    let openPriceToClose: { id: number; validTo: Date } | undefined;

    for (const existing of existingPrices) {
      if (
        existing.validTo === null &&
        existing.validFrom.getTime() < validFrom.getTime()
      ) {
        openPriceToClose = {
          id: existing.id,
          validTo: addUtcDays(validFrom, -1),
        };
        continue;
      }

      if (intervalsOverlap(validFrom, validTo, existing.validFrom, existing.validTo)) {
        throw new ConflictError('Price validity interval overlaps with an existing price');
      }
    }

    return this.pricesRepository.createWithOptionalClose({
      placeId,
      unitCents: input.unitCents,
      validFrom,
      validTo,
      closePriceUpdate: openPriceToClose,
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

    const activePrice = prices.find((p) => {
      const fromMs = p.validFrom.getTime();
      const toMs = p.validTo ? p.validTo.getTime() : Number.POSITIVE_INFINITY;
      return fromMs <= targetMs && targetMs <= toMs;
    });

    if (!activePrice) {
      throw new NotFoundError('No active price found for this place on the specified date');
    }

    return activePrice;
  }
}
