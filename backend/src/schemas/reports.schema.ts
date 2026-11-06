import { z } from 'zod';

const isoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

export const reportSummaryQuerySchema = z.object({
  placeId: z.coerce.number().int().positive().optional(),
  from: isoDateString.optional(),
  to: isoDateString.optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

export type ReportSummaryQuery = z.infer<typeof reportSummaryQuerySchema>;
