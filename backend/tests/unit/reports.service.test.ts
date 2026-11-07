import { beforeEach, describe, expect, it } from 'vitest';
import type {
  DeliveryWithPlace,
  FindActiveDeliveriesReportParams,
  ReportsRepository,
} from '../../src/repositories/reports.repository';
import { ReportsService } from '../../src/services/reports.service';
import { ValidationError } from '../../src/shared/errors';
import { parseUtcDateOnly } from '../../src/shared/lib/date';

export class InMemoryReportsRepository implements Pick<ReportsRepository, 'findActiveDeliveries'> {
  public records: DeliveryWithPlace[] = [];

  async findActiveDeliveries(
    params: FindActiveDeliveriesReportParams,
  ): Promise<DeliveryWithPlace[]> {
    return this.records
      .filter((r) => {
        if (params.placeId !== undefined && r.placeId !== params.placeId) return false;
        if (params.from && r.date.getTime() < params.from.getTime()) return false;
        if (params.to && r.date.getTime() > params.to.getTime()) return false;
        return true;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime() || a.id - b.id);
  }
}

describe('ReportsService Unit Tests (Phase 6/7 — Expected Value & Price History)', () => {
  let repo: InMemoryReportsRepository;
  let reportsService: ReportsService;

  beforeEach(() => {
    repo = new InMemoryReportsRepository();
    reportsService = new ReportsService(repo as unknown as ReportsRepository);

    // Scenario hand-calculated:
    // 1. Prefeitura (placeId = 1):
    //    - 2026-01-05 (Mon): 25 units @ R$ 18,00 (1800 cents) = 45000 cents (R$ 450,00)
    //    - 2026-01-12 (Mon): Price changed to R$ 20,00 (2000 cents) -> 10 units @ 2000 = 20000 cents (R$ 200,00)
    //    - 2026-01-15 (Thu): 5 units @ 2000 = 10000 cents, BUT CANCELED (must be ignored!)
    //    => Expected Prefeitura Active: 35 units, 65000 cents (R$ 650,00)
    //
    // 2. Fórum (placeId = 2):
    //    - 2026-01-05 (Mon): 12 units @ R$ 21,00 (2100 cents) = 25200 cents (R$ 252,00)
    //    - 2026-02-03 (Tue): 10 units @ R$ 21,00 (2100 cents) = 21000 cents (R$ 210,00)
    //    => Expected Fórum Active: 22 units, 46200 cents (R$ 462,00)
    //
    // Grand Total Expected:
    //    totalQuantity = 35 + 22 = 57
    //    expectedAmountCents = 65000 + 46200 = 111200 cents (R$ 1.112,00)

    repo.records.push(
      {
        id: 1,
        placeId: 1,
        createdBy: 1,
        date: parseUtcDateOnly('2026-01-05'),
        quantity: 25,
        unitCents: 1800,
        totalCents: 45000,
        createdAt: new Date(),
        place: { id: 1, name: 'Prefeitura', active: true },
      },
      {
        id: 2,
        placeId: 2,
        createdBy: 1,
        date: parseUtcDateOnly('2026-01-05'),
        quantity: 12,
        unitCents: 2100,
        totalCents: 25200,
        createdAt: new Date(),
        place: { id: 2, name: 'Fórum', active: true },
      },
      {
        id: 3,
        placeId: 1,
        createdBy: 1,
        date: parseUtcDateOnly('2026-01-12'),
        quantity: 10,
        unitCents: 2000,
        totalCents: 20000,
        createdAt: new Date(),
        place: { id: 1, name: 'Prefeitura', active: true },
      },
      {
        id: 5,
        placeId: 2,
        createdBy: 1,
        date: parseUtcDateOnly('2026-02-03'),
        quantity: 10,
        unitCents: 2100,
        totalCents: 21000,
        createdAt: new Date(),
        place: { id: 2, name: 'Fórum', active: true },
      },
    );
  });

  it('calculates exact hand-verified totals, ignores canceled records, and preserves distinct frozen price rates', async () => {
    const summary = await reportsService.getSummary({
      groupBy: 'day',
    });

    expect(summary.totalQuantity).toBe(57);
    expect(summary.expectedAmountCents).toBe(111200);

    // Sum of byPlace must match grand total to the exact cent
    const sumByPlaceCents = summary.byPlace.reduce((acc, p) => acc + p.expectedAmountCents, 0);
    expect(sumByPlaceCents).toBe(summary.expectedAmountCents);

    // Sum of byPeriod must match grand total to the exact cent
    const sumByPeriodCents = summary.byPeriod.reduce((acc, p) => acc + p.expectedAmountCents, 0);
    expect(sumByPeriodCents).toBe(summary.expectedAmountCents);

    const prefeitura = summary.byPlace.find((p) => p.placeName === 'Prefeitura');
    expect(prefeitura).toEqual({
      placeId: 1,
      placeName: 'Prefeitura',
      totalQuantity: 35,
      expectedAmountCents: 65000,
      rates: [
        { unitCents: 1800, totalQuantity: 25, expectedAmountCents: 45000 },
        { unitCents: 2000, totalQuantity: 10, expectedAmountCents: 20000 },
      ],
    });

    const forum = summary.byPlace.find((p) => p.placeName === 'Fórum');
    expect(forum).toEqual({
      placeId: 2,
      placeName: 'Fórum',
      totalQuantity: 22,
      expectedAmountCents: 46200,
      rates: [{ unitCents: 2100, totalQuantity: 22, expectedAmountCents: 46200 }],
    });
  });

  it('groups accurately by day, week, and month', async () => {
    const byMonth = await reportsService.getSummary({ groupBy: 'month' });
    expect(byMonth.byPeriod).toEqual([
      { period: '2026-01', totalQuantity: 47, expectedAmountCents: 90200 },
      { period: '2026-02', totalQuantity: 10, expectedAmountCents: 21000 },
    ]);

    const byWeek = await reportsService.getSummary({ groupBy: 'week' });
    expect(byWeek.byPeriod).toEqual([
      { period: '2026-01-04', totalQuantity: 37, expectedAmountCents: 70200 },
      { period: '2026-01-11', totalQuantity: 10, expectedAmountCents: 20000 },
      { period: '2026-02-01', totalQuantity: 10, expectedAmountCents: 21000 },
    ]);
  });

  it('filters by placeId and date range and validates invalid range', async () => {
    const filtered = await reportsService.getSummary({
      placeId: 1,
      from: '2026-01-01',
      to: '2026-01-10',
      groupBy: 'day',
    });

    expect(filtered.totalQuantity).toBe(25);
    expect(filtered.expectedAmountCents).toBe(45000);

    await expect(
      reportsService.getSummary({
        from: '2026-02-01',
        to: '2026-01-01',
        groupBy: 'day',
      }),
    ).rejects.toThrow(ValidationError);
  });
});
