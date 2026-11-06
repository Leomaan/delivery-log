import { ReportsRepository } from '../repositories/reports.repository';
import type { ReportSummaryQuery } from '../schemas/reports.schema';
import { ValidationError } from '../shared/errors';
import { addUtcDays, formatUtcDateOnly, parseUtcDateOnly } from '../shared/lib/date';

export interface PriceRateBreakdownItem {
  unitCents: number;
  totalQuantity: number;
  expectedAmountCents: number;
}

export interface PlaceReportSummaryItem {
  placeId: number;
  placeName: string;
  totalQuantity: number;
  expectedAmountCents: number;
  rates: PriceRateBreakdownItem[];
}

export interface PeriodReportSummaryItem {
  period: string;
  totalQuantity: number;
  expectedAmountCents: number;
}

export interface ReportSummaryResult {
  totalQuantity: number;
  expectedAmountCents: number;
  byPlace: PlaceReportSummaryItem[];
  byPeriod: PeriodReportSummaryItem[];
}

function getPeriodKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
  if (groupBy === 'day') {
    return formatUtcDateOnly(date);
  }

  if (groupBy === 'month') {
    const year = String(date.getUTCFullYear()).padStart(4, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  // groupBy === 'week': Monday of the UTC week (YYYY-MM-DD)
  const dayOfWeek = date.getUTCDay(); // 0 (Sun) to 6 (Sat)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = addUtcDays(date, diffToMonday);
  return formatUtcDateOnly(monday);
}

export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepository = new ReportsRepository()) {}

  async getSummary(query: ReportSummaryQuery): Promise<ReportSummaryResult> {
    const fromDate = query.from !== undefined ? parseUtcDateOnly(query.from, 'from') : undefined;
    const toDate = query.to !== undefined ? parseUtcDateOnly(query.to, 'to') : undefined;

    if (fromDate && toDate && toDate.getTime() < fromDate.getTime()) {
      throw new ValidationError('to date cannot be earlier than from date');
    }

    const deliveries = await this.reportsRepository.findActiveDeliveries({
      placeId: query.placeId,
      from: fromDate,
      to: toDate,
    });

    let totalQuantity = 0;
    let expectedAmountCents = 0;

    const placeMap = new Map<
      number,
      {
        placeId: number;
        placeName: string;
        totalQuantity: number;
        expectedAmountCents: number;
        ratesMap: Map<number, PriceRateBreakdownItem>;
      }
    >();

    const periodMap = new Map<string, PeriodReportSummaryItem>();

    for (const delivery of deliveries) {
      totalQuantity += delivery.quantity;
      expectedAmountCents += delivery.totalCents;

      // Aggregate by Place (Prefeitura, Saúde, Fórum, etc.) and frozen unitCents rate
      let placeEntry = placeMap.get(delivery.placeId);
      if (!placeEntry) {
        placeEntry = {
          placeId: delivery.placeId,
          placeName: delivery.place.name,
          totalQuantity: 0,
          expectedAmountCents: 0,
          ratesMap: new Map<number, PriceRateBreakdownItem>(),
        };
        placeMap.set(delivery.placeId, placeEntry);
      }

      placeEntry.totalQuantity += delivery.quantity;
      placeEntry.expectedAmountCents += delivery.totalCents;

      const rateEntry = placeEntry.ratesMap.get(delivery.unitCents) ?? {
        unitCents: delivery.unitCents,
        totalQuantity: 0,
        expectedAmountCents: 0,
      };
      rateEntry.totalQuantity += delivery.quantity;
      rateEntry.expectedAmountCents += delivery.totalCents;
      placeEntry.ratesMap.set(delivery.unitCents, rateEntry);

      // Aggregate by Period (day, week, month)
      const periodKey = getPeriodKey(delivery.date, query.groupBy);
      const periodEntry = periodMap.get(periodKey) ?? {
        period: periodKey,
        totalQuantity: 0,
        expectedAmountCents: 0,
      };
      periodEntry.totalQuantity += delivery.quantity;
      periodEntry.expectedAmountCents += delivery.totalCents;
      periodMap.set(periodKey, periodEntry);
    }

    const byPlace: PlaceReportSummaryItem[] = Array.from(placeMap.values())
      .sort((a, b) => a.placeName.localeCompare(b.placeName) || a.placeId - b.placeId)
      .map((entry) => ({
        placeId: entry.placeId,
        placeName: entry.placeName,
        totalQuantity: entry.totalQuantity,
        expectedAmountCents: entry.expectedAmountCents,
        rates: Array.from(entry.ratesMap.values()).sort((a, b) => a.unitCents - b.unitCents),
      }));

    const byPeriod: PeriodReportSummaryItem[] = Array.from(periodMap.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );

    return {
      totalQuantity,
      expectedAmountCents,
      byPlace,
      byPeriod,
    };
  }
}
