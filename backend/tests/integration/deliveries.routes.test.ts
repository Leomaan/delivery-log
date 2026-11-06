import type { Delivery } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app';
import type { DeliveriesRepository } from '../../src/repositories/deliveries.repository';
import type { PricesRepository } from '../../src/repositories/prices.repository';
import { DeliveriesService } from '../../src/services/deliveries.service';
import { PricesService } from '../../src/services/prices.service';
import { InMemoryDeliveriesStore } from '../unit/deliveries.service.test';

describe('Deliveries Routes Integration Tests', () => {
  let store: InMemoryDeliveriesStore;
  let pricesService: PricesService;
  let deliveriesService: DeliveriesService;
  let app: FastifyInstance | undefined;

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

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  it('POST /api/v1/deliveries, GET /api/v1/deliveries, and POST /api/v1/deliveries/:id/cancel work end-to-end', async () => {
    const server = await buildApp({ pricesService, deliveriesService });
    app = server;

    const token = server.jwt.sign({ sub: 1, email: 'admin@ponto10.local' });
    const headers = { authorization: `Bearer ${token}` };

    // Attempting to create delivery before price is registered returns 400
    const noPriceRes = await server.inject({
      method: 'POST',
      url: '/api/v1/deliveries',
      headers,
      payload: {
        placeId: 1,
        date: '2026-01-10',
        quantity: 12,
      },
    });
    expect(noPriceRes.statusCode).toBe(400);
    expect(noPriceRes.json()).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'No active price found for this place on the specified delivery date',
    });

    // Register price for January
    await server.inject({
      method: 'POST',
      url: '/api/v1/places/1/prices',
      headers,
      payload: {
        unitCents: 1850,
        validFrom: '2026-01-01',
      },
    });

    // Create delivery in January
    const createRes = await server.inject({
      method: 'POST',
      url: '/api/v1/deliveries',
      headers,
      payload: {
        placeId: 1,
        date: '2026-01-10',
        quantity: 10,
      },
    });

    expect(createRes.statusCode).toBe(201);
    const created = createRes.json<Delivery>();
    expect(created.unitCents).toBe(1850);
    expect(created.totalCents).toBe(18500);
    expect(created.createdBy).toBe(1);

    // Filter deliveries by placeId and date range
    const listRes = await server.inject({
      method: 'GET',
      url: '/api/v1/deliveries?placeId=1&from=2026-01-01&to=2026-01-31&page=1&limit=10',
      headers,
    });

    expect(listRes.statusCode).toBe(200);
    const listBody = listRes.json<{
      items: Delivery[];
      total: number;
      totalQuantity: number;
      totalDeliveredCents: number;
    }>();
    expect(listBody.total).toBe(1);
    expect(listBody.totalQuantity).toBe(10);
    expect(listBody.totalDeliveredCents).toBe(18500);

    // Cancel without reason fails with 400
    const badCancelRes = await server.inject({
      method: 'POST',
      url: `/api/v1/deliveries/${String(created.id)}/cancel`,
      headers,
      payload: { reason: '' },
    });
    expect(badCancelRes.statusCode).toBe(400);

    // Valid cancel succeeds and removes from active totals
    const cancelRes = await server.inject({
      method: 'POST',
      url: `/api/v1/deliveries/${String(created.id)}/cancel`,
      headers,
      payload: { reason: 'Client canceled order before dispatch' },
    });
    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.json<Delivery>().cancelReason).toBe('Client canceled order before dispatch');

    const postCancelList = await server.inject({
      method: 'GET',
      url: '/api/v1/deliveries?placeId=1',
      headers,
    });
    expect(postCancelList.statusCode).toBe(200);
    expect(postCancelList.json<{ total: number; totalDeliveredCents: number }>()).toMatchObject({
      total: 0,
      totalDeliveredCents: 0,
    });
  });
});
