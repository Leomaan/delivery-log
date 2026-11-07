import { z } from 'zod';

const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

export const deliveryIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Delivery id must be a positive integer'),
});

export const createDeliverySchema = z.object({
  placeId: z.number().int().positive('placeId must be a positive integer'),
  date: isoDateString,
  quantity: z.number().int().positive('quantity must be a positive integer'),
});

export const updateDeliverySchema = z.object({
  quantity: z.number().int().positive('quantity must be a positive integer'),
});

export const listDeliveriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  placeId: z.coerce.number().int().positive().optional(),
  from: isoDateString.optional(),
  to: isoDateString.optional(),
});

export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
export type UpdateDeliveryInput = z.infer<typeof updateDeliverySchema>;
export type ListDeliveriesQuery = z.infer<typeof listDeliveriesQuerySchema>;
