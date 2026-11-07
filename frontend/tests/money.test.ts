import { describe, expect, it } from 'vitest';
import { formatCentsToBRL, parseReaisInputToCents } from '../src/utils/currency';
import { formatIsoDateToBR, getWeekBounds, parseLocalIso, toIsoDateLocal } from '../src/utils/date';
import { formatErrorToPtBr, translateApiErrorMessage } from '../src/utils/error';

describe('Frontend currency and date utilities', () => {
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

  it('calculates Brazilian week bounds from Sunday to Saturday', () => {
    // 2026-11-06 is a Friday -> week must start on Sunday 2026-11-01 and end on Saturday 2026-11-07
    const bounds = getWeekBounds(parseLocalIso('2026-11-06'));
    expect(toIsoDateLocal(bounds.start)).toBe('2026-11-01');
    expect(toIsoDateLocal(bounds.end)).toBe('2026-11-07');
  });

  it('translates API error messages to pt-BR and preserves already-translated messages', () => {
    const firstPass = translateApiErrorMessage('Invalid email or password', 401);
    expect(firstPass).toBe('E-mail ou senha incorretos.');
    // Calling formatErrorToPtBr on an Error that was already translated by httpClient must keep the pt-BR message
    expect(formatErrorToPtBr(new Error(firstPass))).toBe('E-mail ou senha incorretos.');
  });
});
