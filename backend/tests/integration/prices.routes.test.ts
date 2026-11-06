import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app';
import type { PricesRepository } from '../../src/repositories/prices.repository';
import { PricesService } from '../../src/services/prices.service';
import { InMemoryPricesRepository } from '../unit/prices.service.test';

describe('Prices Routes Integration Tests', () => {
  let repo: InMemoryPricesRepository;
  let pricesService: PricesService;
  let app: FastifyInstance | undefined;

  beforeEach(() => {
    repo = new InMemoryPricesRepository();
    repo.places.push({
      id: 1,
      name: 'Obra Centro',
      active: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    pricesService = new PricesService(repo as unknown as PricesRepository);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  it('POST /api/v1/places/:id/prices and GET /api/v1/places/:id/prices/active work end-to-end', async () => {
    const server = await buildApp({ pricesService });
    app = server;

    const token = server.jwt.sign({ sub: 1, email: 'admin@ponto10.local' });
    const headers = { authorization: `Bearer ${token}` };

    const create1 = await server.inject({
      method: 'POST',
      url: '/api/v1/places/1/prices',
      headers,
      payload: {
        unitCents: 1800,
        validFrom: '2026-01-01',
      },
    });
    expect(create1.statusCode).toBe(201);

    const create2 = await server.inject({
      method: 'POST',
      url: '/api/v1/places/1/prices',
      headers,
      payload: {
        unitCents: 2000,
        validFrom: '2026-02-01',
      },
    });
    expect(create2.statusCode).toBe(201);

    const overlapRes = await server.inject({
      method: 'POST',
      url: '/api/v1/places/1/prices',
      headers,
      payload: {
        unitCents: 2200,
        validFrom: '2026-01-15',
        validTo: '2026-01-20',
      },
    });
    expect(overlapRes.statusCode).toBe(409);
    expect(overlapRes.json()).toEqual({
      code: 'CONFLICT',
      message: 'Price validity interval overlaps with an existing price',
    });

    const activeJan = await server.inject({
      method: 'GET',
      url: '/api/v1/places/1/prices/active?date=2026-01-31',
      headers,
    });
    expect(activeJan.statusCode).toBe(200);
    expect(activeJan.json<{ unitCents: number }>().unitCents).toBe(1800);

    const activeFeb = await server.inject({
      method: 'GET',
      url: '/api/v1/places/1/prices/active?date=2026-02-01',
      headers,
    });
    expect(activeFeb.statusCode).toBe(200);
    expect(activeFeb.json<{ unitCents: number }>().unitCents).toBe(2000);
  });
});
