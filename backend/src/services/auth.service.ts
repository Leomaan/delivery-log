import { createHash, randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { AuthRepository } from '../repositories/auth.repository';
import type { LoginInput } from '../schemas/auth.schema';
import { UnauthorizedError } from '../shared/errors';

const REFRESH_TOKEN_TTL_DAYS = 7;

export interface AuthenticatedSession {
  user: {
    id: number;
    name: string;
    email: string;
  };
  refreshToken: string;
  refreshExpiresAt: Date;
}

export function hashRefreshToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export function generateRawRefreshToken(): string {
  return randomBytes(48).toString('hex');
}

export class AuthService {
  constructor(private readonly authRepository: AuthRepository = new AuthRepository()) {}

  async login(input: LoginInput): Promise<AuthenticatedSession> {
    const user = await this.authRepository.findUserByEmail(input.email);

    if (!user || !user.active) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatches = await argon2.verify(user.passwordHash, input.password);
    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const rawRefreshToken = generateRawRefreshToken();
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.authRepository.createRefreshToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      refreshToken: rawRefreshToken,
      refreshExpiresAt: expiresAt,
    };
  }

  async refresh(rawRefreshToken: string | undefined): Promise<AuthenticatedSession> {
    if (!rawRefreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);
    const existingToken = await this.authRepository.findRefreshTokenByHash(tokenHash);

    if (
      !existingToken ||
      existingToken.revokedAt !== null ||
      existingToken.expiresAt.getTime() <= Date.now() ||
      !existingToken.user.active
    ) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const newRawRefreshToken = generateRawRefreshToken();
    const newTokenHash = hashRefreshToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.authRepository.rotateRefreshToken(existingToken.id, {
      userId: existingToken.userId,
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
    });

    return {
      user: {
        id: existingToken.user.id,
        name: existingToken.user.name,
        email: existingToken.user.email,
      },
      refreshToken: newRawRefreshToken,
      refreshExpiresAt: newExpiresAt,
    };
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) {
      return;
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);
    await this.authRepository.revokeRefreshTokenByHash(tokenHash);
  }
}
