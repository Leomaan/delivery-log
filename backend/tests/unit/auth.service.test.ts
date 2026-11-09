import argon2 from 'argon2';
import type { RefreshToken, User } from '@prisma/client';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type {
  AuthRepository,
  CreateRefreshTokenData,
} from '../../src/repositories/auth.repository';
import { AuthService, hashRefreshToken } from '../../src/services/auth.service';
import { UnauthorizedError } from '../../src/shared/errors';

export class InMemoryAuthRepository implements Pick<
  AuthRepository,
  | 'findUserByEmail'
  | 'findUserById'
  | 'createRefreshToken'
  | 'findRefreshTokenByHash'
  | 'rotateRefreshToken'
  | 'revokeRefreshTokenByHash'
> {
  public users: User[] = [];
  public refreshTokens: RefreshToken[] = [];
  private nextTokenId = 1;

  async findUserByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async findUserById(id: number): Promise<User | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async createRefreshToken(data: CreateRefreshTokenData): Promise<RefreshToken> {
    const token: RefreshToken = {
      id: this.nextTokenId++,
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
      revokedAt: null,
      createdAt: new Date(),
    };
    this.refreshTokens.push(token);
    return token;
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<(RefreshToken & { user: User }) | null> {
    const token = this.refreshTokens.find((t) => t.tokenHash === tokenHash);
    if (!token) return null;
    const user = this.users.find((u) => u.id === token.userId);
    if (!user) return null;
    return { ...token, user };
  }

  async rotateRefreshToken(
    oldTokenId: number,
    newTokenData: CreateRefreshTokenData,
  ): Promise<RefreshToken> {
    const existing = this.refreshTokens.find((t) => t.id === oldTokenId);
    if (existing) {
      existing.revokedAt = new Date();
    }
    return this.createRefreshToken(newTokenData);
  }

  async revokeRefreshTokenByHash(tokenHash: string): Promise<void> {
    for (const token of this.refreshTokens) {
      if (token.tokenHash === tokenHash && token.revokedAt === null) {
        token.revokedAt = new Date();
      }
    }
  }
}

describe('AuthService Unit Tests', () => {
  let passwordHash: string;
  let repo: InMemoryAuthRepository;
  let authService: AuthService;

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

  it('authenticates valid credentials and stores SHA-256 hash of refresh token', async () => {
    const session = await authService.login({
      email: 'admin@ponto10.local',
      password: 'secret123',
    });

    expect(session.user.email).toBe('admin@ponto10.local');
    expect(session.refreshToken).toBeDefined();
    expect(repo.refreshTokens).toHaveLength(1);
    expect(repo.refreshTokens[0]?.tokenHash).toBe(hashRefreshToken(session.refreshToken));
    expect(repo.refreshTokens[0]?.tokenHash).not.toBe(session.refreshToken);
  });

  it('rejects wrong password or inactive user', async () => {
    await expect(
      authService.login({
        email: 'admin@ponto10.local',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(UnauthorizedError);

    const firstUser = repo.users[0];
    if (firstUser) {
      firstUser.active = false;
    }

    await expect(
      authService.login({
        email: 'admin@ponto10.local',
        password: 'secret123',
      }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('rotates refresh token and rejects reuse of revoked token', async () => {
    const initial = await authService.login({
      email: 'admin@ponto10.local',
      password: 'secret123',
    });

    const rotated = await authService.refresh(initial.refreshToken);
    expect(rotated.refreshToken).not.toBe(initial.refreshToken);

    await expect(authService.refresh(initial.refreshToken)).rejects.toThrow(UnauthorizedError);
  });
});
