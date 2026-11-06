import { ValidationError } from '../errors';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function parseUtcDateOnly(dateStr: string, fieldName = 'date'): Date {
  if (!ISO_DATE_REGEX.test(dateStr)) {
    throw new ValidationError(`${fieldName} must be in YYYY-MM-DD format`);
  }

  const [yearStr = '0', monthStr = '0', dayStr = '0'] = dateStr.split('-');
  const year = Number.parseInt(yearStr, 10);
  const month = Number.parseInt(monthStr, 10);
  const day = Number.parseInt(dayStr, 10);

  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new ValidationError(`${fieldName} is not a valid calendar date`);
  }

  return date;
}

export function addUtcDays(date: Date, days: number): Date {
  const result = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0),
  );
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function formatUtcDateOnly(date: Date): string {
  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
