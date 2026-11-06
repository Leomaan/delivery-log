import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app';
import type { ReportsRepository } from '../../src/repositories/reports.repository';
import { ReportsService, type ReportSummaryResult } from '../../src/services/reports.service';
import { parseUtcDateOnly } from '../../src/shared/lib/date';
import { InMemoryReportsRepository } from '../unit/reports.service.test';

describe('Reports Routes Integration Tests', () => {
  let repo: InMemoryReportsRepository;
  let reportsService: ReportsService;
  let app: FastifyInstance | undefined;

  beforeEach(() => {
    repo = new InMemoryReportsRepository();
    reportsService = new ReportsService(repo as unknown as ReportsRepository);

    repo.records.push(
      {
        id: 1,
        placeId: 1,
        createdBy: 1,
        date: parseUtcDateOnly('2026-01-10'),
        quantity: 25,
        unitCents: 1800,
        totalCents: 45000,
        canceledAt: null,
        cancelReason: null,
        createdAt: new Date(),
        place: { id: 1, name: 'Prefeitura', active: true },
      },
      {
        id: 2,
        placeId: 2,
        createdBy: 1,
        date: parseUtcDateOnly('2026-01-10'),
        quantity: 12,
        unitCents: 2000,
        totalCents: 24000,
        canceledAt: null,
        cancelReason: null,
        createdAt: new Date(),
        place: { id: 2, name: 'Fórum', active: true },
      },
    );
  });

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  it('GET /api/v1/reports/summary requires auth and returns expected values by place and period', async () => {
    const server = await buildApp({ reportsService });
    app = server;

    const unauthRes = await server.inject({
      method: 'GET',
      url: '/api/v1/reports/summary',
    });
    expect(unauthRes.statusCode).toBe(401);

    const token = server.jwt.sign({ sub: 1, email: 'admin@ponto10.local' });
    const headers = { authorization: `Bearer ${token}` };

    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/reports/summary?groupBy=month',
      headers,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<ReportSummaryResult>();
    expect(body.totalQuantity).toBe(37);
    expect(body.expectedAmountCents).toBe(69000);
    expect(body.byPlace).toHaveLength(2);
    expect(body.byPeriod).toEqual([
      {
        period: '2026-01',
        totalQuantity: 37,
        expectedAmountCents: 69000,
      },
    ]);
  });
});
