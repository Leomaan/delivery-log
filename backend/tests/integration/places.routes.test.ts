import type { Place } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app';
import type { PlacesRepository } from '../../src/repositories/places.repository';
import { PlacesService } from '../../src/services/places.service';
import { InMemoryPlacesRepository } from '../unit/places.service.test';

describe('Places Routes Integration Tests', () => {
  let repo: InMemoryPlacesRepository;
  let placesService: PlacesService;
  let app: FastifyInstance | undefined;

  beforeEach(() => {
    repo = new InMemoryPlacesRepository();
    placesService = new PlacesService(repo as unknown as PlacesRepository);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  it('requires authentication and supports full Places lifecycle via HTTP', async () => {
    const server = await buildApp({ placesService });
    app = server;

    const unauthRes = await server.inject({
      method: 'GET',
      url: '/api/v1/places',
    });
    expect(unauthRes.statusCode).toBe(401);

    const token = server.jwt.sign({ sub: 1, email: 'admin@ponto10.local' });
    const headers = { authorization: `Bearer ${token}` };

    const createRes = await server.inject({
      method: 'POST',
      url: '/api/v1/places',
      headers,
      payload: { name: 'Cantina Sul' },
    });

    expect(createRes.statusCode).toBe(201);
    const created = createRes.json<Place>();
    expect(created.name).toBe('Cantina Sul');
    expect(created.active).toBe(true);

    const patchRes = await server.inject({
      method: 'PATCH',
      url: `/api/v1/places/${String(created.id)}`,
      headers,
      payload: { name: 'Cantina Sul - Bloco B' },
    });

    expect(patchRes.statusCode).toBe(200);
    expect(patchRes.json<Place>().name).toBe('Cantina Sul - Bloco B');

    const deactivateRes = await server.inject({
      method: 'POST',
      url: `/api/v1/places/${String(created.id)}/deactivate`,
      headers,
    });

    expect(deactivateRes.statusCode).toBe(200);
    expect(deactivateRes.json<Place>().active).toBe(false);

    const listRes = await server.inject({
      method: 'GET',
      url: '/api/v1/places?active=false&page=1&limit=10',
      headers,
    });

    expect(listRes.statusCode).toBe(200);
    const listBody = listRes.json<{ items: Place[]; total: number }>();
    expect(listBody.total).toBe(1);
    expect(listBody.items[0]?.id).toBe(created.id);

    const deleteRes = await server.inject({
      method: 'DELETE',
      url: `/api/v1/places/${String(created.id)}`,
      headers,
    });
    expect(deleteRes.statusCode).toBe(204);
  });
});
