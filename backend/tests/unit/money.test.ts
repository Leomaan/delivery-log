import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../src/shared/errors';
import {
  assertPositiveCents,
  assertValidCents,
  calculateDeliveryTotalCents,
  centsToReaisString,
  reaisToCents,
} from '../../src/shared/lib/money';

describe('money helpers', () => {
  it('validates integer cents and rejects floats', () => {
    expect(() => assertValidCents(1500)).not.toThrow();
    expect(() => assertValidCents(0)).not.toThrow();
    expect(() => assertValidCents(15.5)).toThrow(ValidationError);
  });

  it('validates strictly positive cents', () => {
    expect(() => assertPositiveCents(100)).not.toThrow();
    expect(() => assertPositiveCents(0)).toThrow(ValidationError);
    expect(() => assertPositiveCents(-100)).toThrow(ValidationError);
  });

  it('calculates delivery total in cents accurately', () => {
    expect(calculateDeliveryTotalCents(12, 1850)).toBe(22200);
    expect(() => calculateDeliveryTotalCents(0, 1850)).toThrow(ValidationError);
    expect(() => calculateDeliveryTotalCents(-2, 1850)).toThrow(ValidationError);
    expect(() => calculateDeliveryTotalCents(5, 0)).toThrow(ValidationError);
  });

  it('converts cents to Reais string representation', () => {
    expect(centsToReaisString(1850)).toBe('18.50');
    expect(centsToReaisString(5)).toBe('0.05');
    expect(centsToReaisString(0)).toBe('0.00');
    expect(centsToReaisString(-1234)).toBe('-12.34');
  });

  it('converts Reais string or number to integer cents without float drift', () => {
    expect(reaisToCents('18.50')).toBe(1850);
    expect(reaisToCents('18,50')).toBe(1850);
    expect(reaisToCents('19.99')).toBe(1999);
    expect(reaisToCents(18.5)).toBe(1850);
    expect(() => reaisToCents('18.555')).toThrow(ValidationError);
    expect(() => reaisToCents('abc')).toThrow(ValidationError);
  });
});
