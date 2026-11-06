import { z } from 'zod';

const isoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

export const placeIdForPricesParamSchema = z.object({
  id: z.coerce.number().int().positive('Place id must be a positive integer'),
});

export const createPriceSchema = z.object({
  unitCents: z.number().int().positive('unitCents must be a positive integer in cents'),
  validFrom: isoDateString,
  validTo: isoDateString.nullable().optional(),
});

export const activePriceQuerySchema = z.object({
  date: isoDateString,
});

export type CreatePriceInput = z.infer<typeof createPriceSchema>;
export type ActivePriceQuery = z.infer<typeof activePriceQuerySchema>;
