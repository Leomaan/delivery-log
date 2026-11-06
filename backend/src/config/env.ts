import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  HOST: z.string().min(1).default('0.0.0.0'),
  CORS_ORIGIN: z.string().url(),
  DATABASE_URL: z
    .string()
    .min(1)
    .refine(
      (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
      'DATABASE_URL must be a valid PostgreSQL connection string',
    ),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(rawEnv: NodeJS.ProcessEnv): Env {
  const parsed = envSchema.safeParse(rawEnv);

  if (!parsed.success) {
    const formattedErrors = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Invalid environment variables:\n${formattedErrors}`);
  }

  return parsed.data;
}

export const env: Env = parseEnv(process.env);
