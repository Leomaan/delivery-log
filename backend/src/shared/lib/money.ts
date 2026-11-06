import { ValidationError } from '../errors';

export function assertValidCents(cents: number, fieldName = 'amountCents'): void {
  if (!Number.isInteger(cents)) {
    throw new ValidationError(`${fieldName} must be an integer in cents`);
  }
}

export function assertPositiveCents(cents: number, fieldName = 'amountCents'): void {
  assertValidCents(cents, fieldName);
  if (cents <= 0) {
    throw new ValidationError(`${fieldName} must be greater than zero`);
  }
}

export function calculateDeliveryTotalCents(quantity: number, unitCents: number): number {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new ValidationError('quantity must be a positive integer');
  }
  assertPositiveCents(unitCents, 'unitCents');
  return quantity * unitCents;
}

export function centsToReaisString(cents: number): string {
  assertValidCents(cents, 'cents');
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const reais = Math.floor(abs / 100);
  const centavos = String(abs % 100).padStart(2, '0');
  return `${sign}${String(reais)}.${centavos}`;
}

export function reaisToCents(reais: string | number): number {
  const normalized = typeof reais === 'number' ? reais.toFixed(2) : reais.trim().replace(',', '.');
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new ValidationError('Invalid currency value');
  }
  const [intPart = '0', decPart = ''] = normalized.split('.');
  const isNegative = normalized.startsWith('-');
  const absInt = Math.abs(Number.parseInt(intPart, 10));
  const paddedDec = decPart.padEnd(2, '0');
  const decValue = Number.parseInt(paddedDec, 10);
  const total = absInt * 100 + decValue;
  return isNegative ? -total : total;
}
