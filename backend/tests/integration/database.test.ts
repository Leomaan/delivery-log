import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runSeed } from '../../prisma/seed';

const initMigrationSqlPath = path.resolve(
  __dirname,
  '../../prisma/migrations/20261106000000_init/migration.sql',
);
const authMigrationSqlPath = path.resolve(
  __dirname,
  '../../prisma/migrations/20261106010000_add_auth_and_users/migration.sql',
);

describe('Phase 2 & 3 — Database Schema, Constraints & Seed', () => {
  it('defines PostgreSQL CHECK constraints and Auth tables in migrations SQL', () => {
    const initSql = fs.readFileSync(initMigrationSqlPath, 'utf-8');
    const authSql = fs.readFileSync(authMigrationSqlPath, 'utf-8');

    expect(initSql).toContain('CONSTRAINT "Delivery_quantity_check" CHECK ("quantity" > 0)');
    expect(initSql).toContain('CONSTRAINT "Delivery_unitCents_check" CHECK ("unitCents" > 0)');
    expect(initSql).toContain(
      'CONSTRAINT "Delivery_totalCents_check" CHECK ("totalCents" = "quantity" * "unitCents")',
    );
    expect(initSql).toContain('CONSTRAINT "Price_unitCents_check" CHECK ("unitCents" > 0)');
    expect(initSql).toContain(
      'CONSTRAINT "Price_valid_range_check" CHECK ("validTo" IS NULL OR "validTo" >= "validFrom")',
    );

    expect(authSql).toContain('CREATE TABLE "User"');
    expect(authSql).toContain('CREATE TABLE "RefreshToken"');
    expect(authSql).toContain('ALTER TABLE "Delivery" ADD COLUMN "createdBy" INTEGER NOT NULL;');
  });

  describe('Live PostgreSQL Database Integration (isolated test schema)', () => {
    let testPrisma: PrismaClient | undefined;
    let dbAvailable = false;
    const testSchema = 'test_phase2';

    beforeAll(async () => {
      const baseUrl =
        process.env.TEST_DATABASE_URL ??
        process.env.DATABASE_URL ??
        'postgresql://postgres:postgres@localhost:5432/lunch_tracker?schema=public';

      const urlObj = new URL(baseUrl);
      urlObj.searchParams.set('schema', testSchema);

      const client = new PrismaClient({
        datasources: {
          db: { url: urlObj.toString() },
        },
      });

      try {
        await client.$connect();
        await client.$executeRaw`DROP SCHEMA IF EXISTS "test_phase2" CASCADE`;
        await client.$executeRaw`CREATE SCHEMA "test_phase2"`;

        await client.$executeRaw`
          CREATE TABLE "User" (
            "id" SERIAL NOT NULL,
            "name" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "passwordHash" TEXT NOT NULL,
            "active" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "User_pkey" PRIMARY KEY ("id")
          )
        `;

        await client.$executeRaw`
          CREATE TABLE "RefreshToken" (
            "id" SERIAL NOT NULL,
            "userId" INTEGER NOT NULL,
            "tokenHash" TEXT NOT NULL,
            "expiresAt" TIMESTAMP(3) NOT NULL,
            "revokedAt" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
          )
        `;

        await client.$executeRaw`
          CREATE TABLE "Place" (
            "id" SERIAL NOT NULL,
            "name" TEXT NOT NULL,
            "active" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
          )
        `;

        await client.$executeRaw`
          CREATE TABLE "Price" (
            "id" SERIAL NOT NULL,
            "placeId" INTEGER NOT NULL,
            "unitCents" INTEGER NOT NULL,
            "validFrom" DATE NOT NULL,
            "validTo" DATE,
            CONSTRAINT "Price_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "Price_unitCents_check" CHECK ("unitCents" > 0),
            CONSTRAINT "Price_valid_range_check" CHECK ("validTo" IS NULL OR "validTo" >= "validFrom"),
            CONSTRAINT "Price_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE RESTRICT ON UPDATE CASCADE
          )
        `;

        await client.$executeRaw`
          CREATE TABLE "Delivery" (
            "id" SERIAL NOT NULL,
            "placeId" INTEGER NOT NULL,
            "createdBy" INTEGER NOT NULL,
            "date" DATE NOT NULL,
            "quantity" INTEGER NOT NULL,
            "unitCents" INTEGER NOT NULL,
            "totalCents" INTEGER NOT NULL,
            "canceledAt" TIMESTAMP(3),
            "cancelReason" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "Delivery_quantity_check" CHECK ("quantity" > 0),
            CONSTRAINT "Delivery_unitCents_check" CHECK ("unitCents" > 0),
            CONSTRAINT "Delivery_totalCents_check" CHECK ("totalCents" = "quantity" * "unitCents"),
            CONSTRAINT "Delivery_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT "Delivery_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
          )
        `;

        testPrisma = client;
        dbAvailable = true;
      } catch {
        dbAvailable = false;
        await client.$disconnect().catch(() => undefined);
      }
    });

    afterAll(async () => {
      if (testPrisma && dbAvailable) {
        await testPrisma.$executeRaw`DROP SCHEMA IF EXISTS "test_phase2" CASCADE`.catch(
          () => undefined,
        );
        await testPrisma.$disconnect();
      }
    });

    it('seeds database (Prefeitura, Saúde, Fórum) and enforces CHECK (quantity > 0) at DB level', async (ctx) => {
      if (!dbAvailable || !testPrisma) {
        ctx.skip();
        return;
      }

      await runSeed(testPrisma);

      const users = await testPrisma.user.findMany();
      const firstUser = users[0];
      expect(firstUser).toBeDefined();
      if (!firstUser) return;

      const places = await testPrisma.place.findMany();
      expect(places.length).toBe(3);

      const firstPlace = places[0];
      expect(firstPlace).toBeDefined();
      if (!firstPlace) return;

      await expect(
        testPrisma.delivery.create({
          data: {
            placeId: firstPlace.id,
            createdBy: firstUser.id,
            date: new Date('2026-02-01T00:00:00.000Z'),
            quantity: 0,
            unitCents: 1800,
            totalCents: 0,
          },
        }),
      ).rejects.toThrow();

      await expect(
        testPrisma.delivery.create({
          data: {
            placeId: firstPlace.id,
            createdBy: firstUser.id,
            date: new Date('2026-02-01T00:00:00.000Z'),
            quantity: -3,
            unitCents: 1800,
            totalCents: -5400,
          },
        }),
      ).rejects.toThrow();
    });
  });
});
