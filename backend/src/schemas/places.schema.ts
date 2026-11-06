import { z } from 'zod';

export const placeIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Place id must be a positive integer'),
});

export const createPlaceSchema = z.object({
  name: z.string().trim().min(2, 'Name must have at least 2 characters').max(120),
});

export const updatePlaceSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must have at least 2 characters').max(120).optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => data.name !== undefined || data.active !== undefined, {
    message: 'At least one field (name or active) must be provided',
  });

export const listPlacesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  active: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export type CreatePlaceInput = z.infer<typeof createPlaceSchema>;
export type UpdatePlaceInput = z.infer<typeof updatePlaceSchema>;
export type ListPlacesQuery = z.infer<typeof listPlacesQuerySchema>;
