import { Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import type { PeriodMode, Place } from '../../types/domain';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';

const PERIOD_TABS: { id: PeriodMode; label: string }[] = [
  { id: 'month', label: 'Mês' },
  { id: 'week', label: 'Semana' },
  { id: 'day', label: 'Dia' },
  { id: 'year', label: 'Ano' },
  { id: 'all', label: 'Tudo' },
  { id: 'custom', label: 'Personalizado' },
];

interface ReportFiltersProps {
  places: Place[];
  periodMode: PeriodMode;
  onPeriodModeChange: (mode: PeriodMode) => void;
  placeId: string;
  onPlaceIdChange: (id: string) => void;
  customFrom: string;
  onCustomFromChange: (val: string) => void;
  customTo: string;
  onCustomToChange: (val: string) => void;
  activeRangeLabel: string;
  canNavigateWithArrows: boolean;
  onNavigateCursor: (direction: -1 | 1) => void;
  onResetToToday: () => void;
}

export function ReportFilters({
  places,
  periodMode,
  onPeriodModeChange,
  placeId,
  onPlaceIdChange,
  customFrom,
  onCustomFromChange,
  customTo,
  onCustomToChange,
  activeRangeLabel,
  canNavigateWithArrows,
  onNavigateCursor,
  onResetToToday,
}: ReportFiltersProps) {
  const placeFilterOptions = [
    { value: '', label: 'Todos os destinos' },
    ...places.map((p) => ({ value: String(p.id), label: p.name })),
  ];

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="block text-xs font-medium text-slate-500 mb-1.5">
            Escolha o período do relatório
          </span>
          <div className="inline-flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
            {PERIOD_TABS.map((tab) => (
              <Button
                key={tab.id}
                variant="tab"
                size="sm"
                active={periodMode === tab.id}
                onClick={() => onPeriodModeChange(tab.id)}
                className="px-3 py-1.5 font-medium"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="sm:w-64">
          <label className="flex items-center gap-1 text-xs font-medium text-slate-500 mb-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filtrar por Destino</span>
          </label>
          <Select
            value={placeId}
            options={placeFilterOptions}
            onChange={(e) => onPlaceIdChange(e.target.value)}
            className="w-full py-2 text-sm"
          />
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {canNavigateWithArrows && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigateCursor(-1)}
              title="Período anterior"
              className="w-8 h-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50/70 border border-blue-100 min-w-52 justify-center">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-sm font-semibold text-slate-900">{activeRangeLabel}</span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigateCursor(1)}
              title="Próximo período"
              className="w-8 h-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            <Button variant="ghost" size="sm" onClick={onResetToToday} className="text-blue-600">
              Hoje
            </Button>
          </div>
        )}

        {periodMode === 'all' && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50/70 border border-blue-100">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-sm font-semibold text-slate-900">{activeRangeLabel}</span>
          </div>
        )}

        {periodMode === 'custom' && (
          <div className="flex flex-wrap items-end gap-3">
            <Input
              label="Data Inicial"
              type="date"
              value={customFrom}
              onChange={(e) => onCustomFromChange(e.target.value)}
            />
            <Input
              label="Data Final"
              type="date"
              value={customTo}
              onChange={(e) => onCustomToChange(e.target.value)}
            />
          </div>
        )}

        <span className="text-xs text-slate-400">
          {placeId
            ? `Mostrando apenas: ${places.find((p) => String(p.id) === placeId)?.name ?? ''}`
            : 'Mostrando todos os destinos'}
        </span>
      </div>
    </section>
  );
}
