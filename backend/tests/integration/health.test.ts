import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { buildApp } from '../../src/app';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../src/shared/errors';

describe('App Core & Phase 1 Integration Tests', () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  it('GET /health returns 200 with ok status and security headers', async () => {
    app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
    expect(response.headers['x-request-id']).toBeDefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('GET /api/v1/health returns 200 under API v1 prefix', async () => {
    app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('preserves incoming x-request-id header in response', async () => {
    app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        'x-request-id': 'custom-req-123',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['x-request-id']).toBe('custom-req-123');
  });

  it('returns standardized 404 JSON for unknown routes', async () => {
    app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/non-existent-route',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      code: 'NOT_FOUND',
      message: 'Route not found',
    });
  });

  it('handles domain errors (NotFoundError, ConflictError, ValidationError, UnauthorizedError, ForbiddenError) with standardized JSON', async () => {
    app = await buildApp();

    app.get('/api/v1/test-not-found', async () => {
      throw new NotFoundError('Place not found');
    });

    app.get('/api/v1/test-conflict', async () => {
      throw new ConflictError('Price interval overlaps with existing price');
    });

    app.get('/api/v1/test-validation', async () => {
      throw new ValidationError('Quantity must be greater than zero');
    });

    app.get('/api/v1/test-unauthorized', async () => {
      throw new UnauthorizedError('Invalid token');
    });

    app.get('/api/v1/test-forbidden', async () => {
      throw new ForbiddenError('Admin role required');
    });

    const notFoundRes = await app.inject({ method: 'GET', url: '/api/v1/test-not-found' });
    expect(notFoundRes.statusCode).toBe(404);
    expect(notFoundRes.json()).toEqual({
      code: 'NOT_FOUND',
      message: 'Place not found',
    });

    const conflictRes = await app.inject({ method: 'GET', url: '/api/v1/test-conflict' });
    expect(conflictRes.statusCode).toBe(409);
    expect(conflictRes.json()).toEqual({
      code: 'CONFLICT',
      message: 'Price interval overlaps with existing price',
    });

    const validationRes = await app.inject({ method: 'GET', url: '/api/v1/test-validation' });
    expect(validationRes.statusCode).toBe(400);
    expect(validationRes.json()).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Quantity must be greater than zero',
    });

    const unauthorizedRes = await app.inject({ method: 'GET', url: '/api/v1/test-unauthorized' });
    expect(unauthorizedRes.statusCode).toBe(401);
    expect(unauthorizedRes.json()).toEqual({
      code: 'UNAUTHORIZED',
      message: 'Invalid token',
    });

    const forbiddenRes = await app.inject({ method: 'GET', url: '/api/v1/test-forbidden' });
    expect(forbiddenRes.statusCode).toBe(403);
    expect(forbiddenRes.json()).toEqual({
      code: 'FORBIDDEN',
      message: 'Admin role required',
    });
  });

  it('handles ZodError and returns 400 VALIDATION_ERROR', async () => {
    app = await buildApp();

    const bodySchema = z.object({
      quantity: z.number().int().positive(),
    });

    app.post('/api/v1/test-zod', async (request) => {
      return bodySchema.parse(request.body);
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/test-zod',
      payload: { quantity: -5 },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json<{ code: string; message: string }>();
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.message).toContain('quantity');
  });

  it('masks unexpected internal errors with generic 500 response', async () => {
    app = await buildApp();

    app.get('/api/v1/test-crash', async () => {
      throw new Error('Sensitive database connection string leak');
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/test-crash',
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  });

  it('serves OpenAPI specification at GET /docs/json', async () => {
    app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/docs/json',
    });

    expect(response.statusCode).toBe(200);
    const spec = response.json<{ openapi: string; info: { title: string } }>();
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.info.title).toContain('Lunch Tracker API');
  });
});
