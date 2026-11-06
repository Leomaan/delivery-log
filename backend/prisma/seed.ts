import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { calculateDeliveryTotalCents } from '../src/shared/lib/money';

export async function runSeed(client: PrismaClient): Promise<void> {
  const passwordHash = await argon2.hash('admin123');

  await client.$transaction(async (tx) => {
    await tx.delivery.deleteMany();
    await tx.price.deleteMany();
    await tx.place.deleteMany();
    await tx.refreshToken.deleteMany();
    await tx.user.deleteMany();

    const adminUser = await tx.user.create({
      data: {
        name: 'Ponto 10 Admin',
        email: 'admin@ponto10.local',
        passwordHash,
        active: true,
      },
    });

    const prefeitura = await tx.place.create({
      data: {
        name: 'Prefeitura',
        active: true,
      },
    });

    const saude = await tx.place.create({
      data: {
        name: 'Saúde',
        active: true,
      },
    });

    const forum = await tx.place.create({
      data: {
        name: 'Fórum',
        active: true,
      },
    });

    const unitPrefeitura = 1800; // R$ 18,00
    const unitSaude = 1900; // R$ 19,00
    const unitForum = 2000; // R$ 20,00

    await tx.price.createMany({
      data: [
        {
          placeId: prefeitura.id,
          unitCents: unitPrefeitura,
          validFrom: new Date('2026-01-01T00:00:00.000Z'),
          validTo: null,
        },
        {
          placeId: saude.id,
          unitCents: unitSaude,
          validFrom: new Date('2026-01-01T00:00:00.000Z'),
          validTo: null,
        },
        {
          placeId: forum.id,
          unitCents: unitForum,
          validFrom: new Date('2026-01-01T00:00:00.000Z'),
          validTo: null,
        },
      ],
    });

    await tx.delivery.createMany({
      data: [
        {
          placeId: prefeitura.id,
          createdBy: adminUser.id,
          date: new Date('2026-01-10T00:00:00.000Z'),
          quantity: 25,
          unitCents: unitPrefeitura,
          totalCents: calculateDeliveryTotalCents(25, unitPrefeitura),
        },
        {
          placeId: saude.id,
          createdBy: adminUser.id,
          date: new Date('2026-01-10T00:00:00.000Z'),
          quantity: 15,
          unitCents: unitSaude,
          totalCents: calculateDeliveryTotalCents(15, unitSaude),
        },
        {
          placeId: forum.id,
          createdBy: adminUser.id,
          date: new Date('2026-01-10T00:00:00.000Z'),
          quantity: 12,
          unitCents: unitForum,
          totalCents: calculateDeliveryTotalCents(12, unitForum),
        },
      ],
    });
  });
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await runSeed(prisma);
    console.info('[seed] Development database seeded successfully.');
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main();
}
