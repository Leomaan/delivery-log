import type { PeriodMode } from '../types/domain';

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const WEEKDAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export function toIsoDateLocal(d: Date): string {
  const y = String(d.getFullYear()).padStart(4, '0');
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTodayIsoDate(): string {
  return toIsoDateLocal(new Date());
}

export function parseLocalIso(iso: string): Date {
  const [y = 2026, m = 1, d = 1] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatIsoDateToBR(isoDate: string): string {
  const datePart = isoDate.slice(0, 10);
  const [year = '', month = '', day = ''] = datePart.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

export function getWeekBounds(refDate: Date): { start: Date; end: Date } {
  const day = refDate.getDay(); // 0 (Domingo) a 6 (Sábado)
  const start = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - day);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return { start, end };
}

export function advanceCursorDate(prev: Date, periodMode: PeriodMode, direction: -1 | 1): Date {
  const y = prev.getFullYear();
  const m = prev.getMonth();
  const d = prev.getDate();

  if (periodMode === 'day') {
    return new Date(y, m, d + direction);
  }
  if (periodMode === 'week') {
    return new Date(y, m, d + direction * 7);
  }
  if (periodMode === 'month') {
    return new Date(y, m + direction, 1);
  }
  if (periodMode === 'year') {
    return new Date(y + direction, m, 1);
  }
  return prev;
}

export function computeReportDateRange(
  periodMode: PeriodMode,
  cursorDate: Date,
  customFrom: string,
  customTo: string,
): { from?: string; to?: string; label: string } {
  const year = cursorDate.getFullYear();
  const month = cursorDate.getMonth();

  if (periodMode === 'day') {
    const iso = toIsoDateLocal(cursorDate);
    const weekday = WEEKDAY_NAMES[cursorDate.getDay()] ?? '';
    return {
      from: iso,
      to: iso,
      label: `${weekday}, ${formatIsoDateToBR(iso)}`,
    };
  }

  if (periodMode === 'week') {
    const { start, end } = getWeekBounds(cursorDate);
    const fromIso = toIsoDateLocal(start);
    const toIso = toIsoDateLocal(end);
    return {
      from: fromIso,
      to: toIso,
      label: `${formatIsoDateToBR(fromIso)} até ${formatIsoDateToBR(toIso)}`,
    };
  }

  if (periodMode === 'month') {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const monthName = MONTH_NAMES[month] ?? '';
    return {
      from: toIsoDateLocal(firstDay),
      to: toIsoDateLocal(lastDay),
      label: `${monthName} de ${String(year)}`,
    };
  }

  if (periodMode === 'year') {
    return {
      from: `${String(year)}-01-01`,
      to: `${String(year)}-12-31`,
      label: `Ano de ${String(year)}`,
    };
  }

  if (periodMode === 'custom') {
    const fromLabel = customFrom ? formatIsoDateToBR(customFrom) : 'Início';
    const toLabel = customTo ? formatIsoDateToBR(customTo) : 'Hoje';
    return {
      from: customFrom || undefined,
      to: customTo || undefined,
      label: `${fromLabel} até ${toLabel}`,
    };
  }

  return {
    from: undefined,
    to: undefined,
    label: 'Todo o histórico registrado',
  };
}

export function formatPeriodRowLabel(period: string, groupBy: 'day' | 'week' | 'month'): string {
  if (groupBy === 'day') {
    const d = parseLocalIso(period);
    const weekday = WEEKDAY_NAMES[d.getDay()] ?? '';
    return `${formatIsoDateToBR(period)} (${weekday})`;
  }

  if (groupBy === 'month') {
    const [year = '', monthStr = ''] = period.split('-');
    const monthIndex = Number(monthStr) - 1;
    const monthName = MONTH_NAMES[monthIndex] ?? monthStr;
    return `${monthName} de ${year}`;
  }

  const start = parseLocalIso(period);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return `Semana de ${formatIsoDateToBR(toIsoDateLocal(start))} a ${formatIsoDateToBR(toIsoDateLocal(end))}`;
}
