import { useReports } from '../hooks/useReports';
import type { Place } from '../types/domain';
import { ReportFilters } from './reports/ReportFilters';
import { ReportHistoryTable } from './reports/ReportHistoryTable';
import { ReportPlacesBreakdown } from './reports/ReportPlacesBreakdown';
import { ReportSummaryCards } from './reports/ReportSummaryCards';

interface ReportsViewProps {
  places: Place[];
}

export function ReportsView({ places }: ReportsViewProps) {
  const {
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
  } = useReports();

  return (
    <div className="space-y-6">
      <ReportFilters
        places={places}
        periodMode={periodMode}
        onPeriodModeChange={setPeriodMode}
        placeId={placeId}
        onPlaceIdChange={setPlaceId}
        customFrom={customFrom}
        onCustomFromChange={setCustomFrom}
        customTo={customTo}
        onCustomToChange={setCustomTo}
        activeRangeLabel={activeRange.label}
        canNavigateWithArrows={canNavigateWithArrows}
        onNavigateCursor={navigateCursor}
        onResetToToday={resetToToday}
      />

      <ReportSummaryCards
        summary={summary}
        loading={loading}
        activeRangeLabel={activeRange.label}
      />

      <ReportPlacesBreakdown summary={summary} activeRangeLabel={activeRange.label} />

      <ReportHistoryTable
        tableGroupBy={tableGroupBy}
        onTableGroupByChange={setTableGroupBy}
        sortedPeriods={sortedPeriods}
      />
    </div>
  );
}
