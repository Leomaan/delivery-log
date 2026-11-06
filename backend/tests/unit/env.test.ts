import { describe, expect, it } from 'vitest';
import { parseEnv } from '../../src/config/env';

describe('parseEnv', () => {
  const validRawEnv: NodeJS.ProcessEnv = {
    NODE_ENV: 'development',
    PORT: '3333',
    HOST: '0.0.0.0',
    CORS_ORIGIN: 'http://localhost:5173',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/lunch_tracker?schema=public',
    JWT_SECRET: 'super-secret-jwt-key-with-32-characters-minimum',
  };

  it('parses valid environment variables accurately', () => {
    const result = parseEnv(validRawEnv);

    expect(result).toEqual({
      NODE_ENV: 'development',
      PORT: 3333,
      HOST: '0.0.0.0',
      CORS_ORIGIN: 'http://localhost:5173',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/lunch_tracker?schema=public',
      JWT_SECRET: 'super-secret-jwt-key-with-32-characters-minimum',
    });
  });

  it('applies default values for NODE_ENV, PORT, and HOST when omitted', () => {
    const result = parseEnv({
      CORS_ORIGIN: 'http://localhost:5173',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/lunch_tracker?schema=public',
      JWT_SECRET: 'super-secret-jwt-key-with-32-characters-minimum',
    });

    expect(result.NODE_ENV).toBe('development');
    expect(result.PORT).toBe(3333);
    expect(result.HOST).toBe('0.0.0.0');
  });

  it('throws an error when required variables are missing', () => {
    expect(() => parseEnv({})).toThrowError(/Invalid environment variables/);
  });

  it('throws an error when DATABASE_URL is not a valid postgres connection string', () => {
    expect(() =>
      parseEnv({
        ...validRawEnv,
        DATABASE_URL: 'mysql://localhost:3306/db',
      }),
    ).toThrowError(/DATABASE_URL must be a valid PostgreSQL connection string/);
  });

  it('throws an error when JWT_SECRET is shorter than 32 characters', () => {
    expect(() =>
      parseEnv({
        ...validRawEnv,
        JWT_SECRET: 'short-secret',
      }),
    ).toThrowError(/JWT_SECRET must be at least 32 characters long/);
  });
});
