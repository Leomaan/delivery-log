import { Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useReports } from '../hooks/useReports';
import type { PeriodMode, Place } from '../types/domain';
import { formatCentsToBRL } from '../utils/currency';
import { formatPeriodRowLabel } from '../utils/date';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';

interface ReportsViewProps {
  places: Place[];
}

const PERIOD_TABS: { id: PeriodMode; label: string }[] = [
  { id: 'month', label: 'Mês' },
  { id: 'week', label: 'Semana' },
  { id: 'day', label: 'Dia' },
  { id: 'year', label: 'Ano' },
  { id: 'all', label: 'Tudo' },
  { id: 'custom', label: 'Personalizado' },
];

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

  const placeFilterOptions = [
    { value: '', label: 'Todos os destinos' },
    ...places.map((p) => ({ value: String(p.id), label: p.name })),
  ];

  return (
    <div className="space-y-6">
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
                  onClick={() => setPeriodMode(tab.id)}
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
              onChange={(e) => setPlaceId(e.target.value)}
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
                onClick={() => navigateCursor(-1)}
                title="Período anterior"
                className="w-8 h-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50/70 border border-blue-100 min-w-52 justify-center">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-sm font-semibold text-slate-900">{activeRange.label}</span>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigateCursor(1)}
                title="Próximo período"
                className="w-8 h-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              <Button variant="ghost" size="sm" onClick={resetToToday} className="text-blue-600">
                Hoje
              </Button>
            </div>
          )}

          {periodMode === 'all' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50/70 border border-blue-100">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-sm font-semibold text-slate-900">{activeRange.label}</span>
            </div>
          )}

          {periodMode === 'custom' && (
            <div className="flex flex-wrap items-end gap-3">
              <Input
                label="Data Inicial"
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
              <Input
                label="Data Final"
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Total de Quentinhas Entregues
            </span>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {loading ? '...' : `${String(summary?.totalQuantity ?? 0)} un.`}
            </p>
          </div>
          <span className="text-xs text-slate-400 mt-3">{activeRange.label}</span>
        </div>

        <div className="bg-blue-600 text-white rounded-xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-blue-100">
              Valor Total a Receber
            </span>
            <p className="text-3xl font-bold mt-2">
              {loading ? '...' : formatCentsToBRL(summary?.expectedAmountCents ?? 0)}
            </p>
          </div>
          <span className="text-xs text-blue-100 mt-3">
            Calculado com o preço vigente de cada entrega
          </span>
        </div>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900">Resumo por Destino</h3>
          <p className="text-xs text-slate-500">
            Quanto cada local pediu e quanto deve ser cobrado no período selecionado
          </p>
        </div>

        {summary?.byPlace.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl">
            <p className="text-sm text-slate-500">
              Nenhuma entrega registrada em <strong>{activeRange.label}</strong>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary?.byPlace.map((placeItem) => {
              const totalCents = summary.expectedAmountCents || 1;
              const sharePercent = Math.round((placeItem.expectedAmountCents / totalCents) * 100);

              return (
                <div
                  key={placeItem.placeId}
                  className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-sm text-slate-900">
                          {placeItem.placeName}
                        </h4>
                        <span className="text-xs text-slate-500">
                          {placeItem.totalQuantity} quentinhas ({sharePercent}% do valor total)
                        </span>
                      </div>
                      <span className="text-base font-bold text-blue-600">
                        {formatCentsToBRL(placeItem.expectedAmountCents)}
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden my-3">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${String(Math.max(sharePercent, 4))}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 space-y-1">
                    {placeItem.rates.map((rate) => (
                      <div
                        key={rate.unitCents}
                        className="flex items-center justify-between text-xs text-slate-600"
                      >
                        <span>
                          {rate.totalQuantity} un. × {formatCentsToBRL(rate.unitCents)}
                        </span>
                        <span className="font-medium text-slate-800">
                          {formatCentsToBRL(rate.expectedAmountCents)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {tableGroupBy === 'day' ? 'Histórico Dia a Dia' : 'Histórico Mês a Mês'}
            </h3>
            <p className="text-xs text-slate-500">
              Soma das entregas agrupadas por {tableGroupBy === 'day' ? 'data' : 'mês'}
            </p>
          </div>

          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 self-start gap-0.5">
            <Button
              variant="tab"
              size="sm"
              active={tableGroupBy === 'day'}
              onClick={() => setTableGroupBy('day')}
            >
              Ver por Dia
            </Button>
            <Button
              variant="tab"
              size="sm"
              active={tableGroupBy === 'month'}
              onClick={() => setTableGroupBy('month')}
            >
              Ver por Mês
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                <th className="py-2.5 pr-4">{tableGroupBy === 'day' ? 'Data' : 'Mês'}</th>
                <th className="py-2.5 px-4 text-right">Quentinhas</th>
                <th className="py-2.5 pl-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sortedPeriods.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-xs text-slate-400">
                    Nenhum registro encontrado neste período.
                  </td>
                </tr>
              ) : (
                sortedPeriods.map((row) => (
                  <tr key={row.period} className="hover:bg-slate-50/80">
                    <td className="py-3 pr-4 font-medium text-slate-800">
                      {formatPeriodRowLabel(row.period, tableGroupBy)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700">{row.totalQuantity} un.</td>
                    <td className="py-3 pl-4 text-right font-semibold text-blue-600">
                      {formatCentsToBRL(row.expectedAmountCents)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
