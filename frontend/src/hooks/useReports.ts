import { useCallback, useEffect, useMemo, useState } from 'react';
import { httpClient } from '../lib/httpClient';
import type { PeriodMode, ReportSummary } from '../types/domain';
import {
  advanceCursorDate,
  computeReportDateRange,
  getTodayIsoDate,
  parseLocalIso,
} from '../utils/date';

export function useReports() {
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month');
  const [cursorDate, setCursorDate] = useState<Date>(() => parseLocalIso(getTodayIsoDate()));
  const [placeId, setPlaceId] = useState<string>('');
  const [customFrom, setCustomFrom] = useState<string>(() => getTodayIsoDate());
  const [customTo, setCustomTo] = useState<string>(() => getTodayIsoDate());
  const [tableGroupBy, setTableGroupBy] = useState<'day' | 'month'>('day');

  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (periodMode === 'year' || periodMode === 'all') {
      setTableGroupBy('month');
    } else {
      setTableGroupBy('day');
    }
  }, [periodMode]);

  const activeRange = useMemo(
    () => computeReportDateRange(periodMode, cursorDate, customFrom, customTo),
    [periodMode, cursorDate, customFrom, customTo],
  );

  const navigateCursor = useCallback(
    (direction: -1 | 1) => {
      setCursorDate((prev) => advanceCursorDate(prev, periodMode, direction));
    },
    [periodMode],
  );

  const resetToToday = useCallback(() => {
    setCursorDate(parseLocalIso(getTodayIsoDate()));
  }, []);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const search = new URLSearchParams();
      if (placeId) search.set('placeId', placeId);
      if (activeRange.from) search.set('from', activeRange.from);
      if (activeRange.to) search.set('to', activeRange.to);
      search.set('groupBy', tableGroupBy);

      const data = await httpClient.get<ReportSummary>(`/reports/summary?${search.toString()}`);
      setSummary(data);
    } finally {
      setLoading(false);
    }
  }, [placeId, activeRange.from, activeRange.to, tableGroupBy]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const sortedPeriods = useMemo(() => {
    if (!summary) return [];
    return [...summary.byPeriod].sort((a, b) => b.period.localeCompare(a.period));
  }, [summary]);

  const canNavigateWithArrows =
    periodMode === 'day' ||
    periodMode === 'week' ||
    periodMode === 'month' ||
    periodMode === 'year';

  return {
    periodMode,
    setPeriodMode,
    placeId,
    setPlaceId,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    tableGroupBy,
    setTableGroupBy,
    summary,
    loading,
    activeRange,
    sortedPeriods,
    canNavigateWithArrows,
    navigateCursor,
    resetToToday,
  };
}
