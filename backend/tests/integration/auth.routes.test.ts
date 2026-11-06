import argon2 from 'argon2';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app';
import { REFRESH_COOKIE_NAME } from '../../src/controllers/auth.controller';
import type { AuthRepository } from '../../src/repositories/auth.repository';
import { AuthService } from '../../src/services/auth.service';
import { InMemoryAuthRepository } from '../unit/auth.service.test';

describe('Auth Routes Integration Tests', () => {
  let passwordHash: string;
  let repo: InMemoryAuthRepository;
  let authService: AuthService;
  let app: FastifyInstance | undefined;

  beforeAll(async () => {
    passwordHash = await argon2.hash('secret123');
  });

  beforeEach(() => {
    repo = new InMemoryAuthRepository();
    repo.users.push({
      id: 1,
      name: 'Ponto 10 Admin',
      email: 'admin@ponto10.local',
      passwordHash,
      active: true,
      createdAt: new Date(),
    });
    authService = new AuthService(repo as unknown as AuthRepository);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  it('POST /api/v1/auth/login returns accessToken and sets httpOnly cookie', async () => {
    const server = await buildApp({ authService });
    app = server;

    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'admin@ponto10.local',
        password: 'secret123',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ accessToken: string; user: { id: number; email: string } }>();
    expect(body.accessToken).toBeDefined();
    expect(body.user.email).toBe('admin@ponto10.local');

    const refreshCookie = response.cookies.find((c) => c.name === REFRESH_COOKIE_NAME);
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie?.httpOnly).toBe(true);
    expect(refreshCookie?.sameSite).toBe('Strict');
  });

  it('GET /api/v1/auth/me returns 401 without token and 200 with valid Bearer token', async () => {
    const server = await buildApp({ authService });
    app = server;

    const unauthRes = await server.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
    });

    expect(unauthRes.statusCode).toBe(401);
    expect(unauthRes.json()).toEqual({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired access token',
    });

    const loginRes = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'admin@ponto10.local',
        password: 'secret123',
      },
    });

    const { accessToken } = loginRes.json<{ accessToken: string }>();

    const authRes = await server.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(authRes.statusCode).toBe(200);
    expect(authRes.json()).toEqual({
      user: expect.objectContaining({
        sub: 1,
        email: 'admin@ponto10.local',
      }),
    });
  });

  it('POST /api/v1/auth/refresh issues new token and POST /api/v1/auth/logout revokes it', async () => {
    const server = await buildApp({ authService });
    app = server;

    const loginRes = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'admin@ponto10.local',
        password: 'secret123',
      },
    });

    const initialCookie = loginRes.cookies.find((c) => c.name === REFRESH_COOKIE_NAME);
    expect(initialCookie).toBeDefined();
    const initialValue = initialCookie?.value ?? '';

    const refreshRes = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      cookies: {
        [REFRESH_COOKIE_NAME]: initialValue,
      },
    });

    expect(refreshRes.statusCode).toBe(200);
    const rotatedCookie = refreshRes.cookies.find((c) => c.name === REFRESH_COOKIE_NAME);
    expect(rotatedCookie).toBeDefined();
    const rotatedValue = rotatedCookie?.value ?? '';
    expect(rotatedValue).not.toBe(initialValue);

    const logoutRes = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      cookies: {
        [REFRESH_COOKIE_NAME]: rotatedValue,
      },
    });

    expect(logoutRes.statusCode).toBe(204);

    const postLogoutRefreshRes = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      cookies: {
        [REFRESH_COOKIE_NAME]: rotatedValue,
      },
    });

    expect(postLogoutRefreshRes.statusCode).toBe(401);
  });
});
