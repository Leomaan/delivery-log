import { describe, expect, it } from 'vitest';
import {
  formatCentsToBRL,
  formatIsoDateToBR,
  parseReaisInputToCents,
} from '../src/lib/money';

describe('Frontend money and date presentation helpers', () => {
  it('formats integer cents to BRL currency string', () => {
    const formatted = formatCentsToBRL(1850);
    expect(formatted).toContain('18,50');
  });

  it('parses Reais input string into integer cents', () => {
    expect(parseReaisInputToCents('18,50')).toBe(1850);
    expect(parseReaisInputToCents('20.00')).toBe(2000);
    expect(parseReaisInputToCents('19')).toBe(1900);
    expect(parseReaisInputToCents('0')).toBeNull();
    expect(parseReaisInputToCents('invalid')).toBeNull();
  });

  it('formats ISO date string to Brazilian DD/MM/YYYY format', () => {
    expect(formatIsoDateToBR('2026-01-15T00:00:00.000Z')).toBe('15/01/2026');
    expect(formatIsoDateToBR('2026-02-01')).toBe('01/02/2026');
  });
});
