import type { PrismaClient, RefreshToken, User } from '@prisma/client';
import { prisma as defaultPrisma } from '../shared/lib/prisma';

export interface CreateRefreshTokenData {
  userId: number;
  tokenHash: string;
  expiresAt: Date;
}

export class AuthRepository {
  constructor(private readonly db: PrismaClient = defaultPrisma) {}

  async findUserByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { email },
    });
  }

  async findUserById(id: number): Promise<User | null> {
    return this.db.user.findUnique({
      where: { id },
    });
  }

  async createRefreshToken(data: CreateRefreshTokenData): Promise<RefreshToken> {
    return this.db.refreshToken.create({
      data,
    });
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<(RefreshToken & { user: User }) | null> {
    return this.db.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async rotateRefreshToken(
    oldTokenId: number,
    newTokenData: CreateRefreshTokenData,
  ): Promise<RefreshToken> {
    return this.db.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: oldTokenId },
        data: { revokedAt: new Date() },
      });

      return tx.refreshToken.create({
        data: newTokenData,
      });
    });
  }

  async revokeRefreshTokenByHash(tokenHash: string): Promise<void> {
    await this.db.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
