import { useCallback, useEffect, useState } from 'react';
import { api, type Place, type ReportSummary } from '../lib/api';
import { formatCentsToBRL, formatIsoDateToBR } from '../lib/money';

interface ReportsViewProps {
  places: Place[];
}

export function ReportsView({ places }: ReportsViewProps) {
  const [placeId, setPlaceId] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getReportSummary({
        placeId: placeId ? Number(placeId) : undefined,
        from: from || undefined,
        to: to || undefined,
        groupBy,
      });
      setSummary(data);
    } finally {
      setLoading(false);
    }
  }, [placeId, from, to, groupBy]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  return (
    <div className="space-y-6">
      {/* Filtros Minimalistas */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Tipo / Destino
            </label>
            <select
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            >
              <option value="">Todos os tipos</option>
              {places.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Data Inicial</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Data Final</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Agrupar Período
            </label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            >
              <option value="day">Por Dia</option>
              <option value="week">Por Semana</option>
              <option value="month">Por Mês</option>
            </select>
          </div>
        </div>
      </section>

      {/* Cards de Totais para Conferência */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Total de Quentinhas Entregues
          </span>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {loading ? '...' : String(summary?.totalQuantity ?? 0)}
          </p>
        </div>

        <div className="bg-blue-600 text-white rounded-xl p-6">
          <span className="text-xs font-medium uppercase tracking-wider text-blue-100">
            Valor Total Esperado (Conferência)
          </span>
          <p className="text-3xl font-bold mt-2">
            {loading ? '...' : formatCentsToBRL(summary?.expectedAmountCents ?? 0)}
          </p>
        </div>
      </div>

      {/* Detalhamento por Tipo e Faixas de Preço */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-1">
          Conferência por Tipo de Quentinha
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Valores calculados com base no preço exato vigente em cada registro (alterações de preço
          não afetam entregas anteriores).
        </p>

        <div className="space-y-4">
          {summary?.byPlace.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              Nenhuma entrega registrada no período selecionado.
            </p>
          ) : (
            summary?.byPlace.map((placeItem) => (
              <div
                key={placeItem.placeId}
                className="border border-slate-200 rounded-xl p-4 bg-slate-50/40"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900">{placeItem.placeName}</h4>
                    <span className="text-xs text-slate-500">
                      {placeItem.totalQuantity} quentinhas no período
                    </span>
                  </div>
                  <span className="text-base font-bold text-blue-600">
                    {formatCentsToBRL(placeItem.expectedAmountCents)}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5">
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
            ))
          )}
        </div>
      </section>

      {/* Evolução por Período */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Resumo por Período</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                <th className="py-2.5 pr-4">Período</th>
                <th className="py-2.5 px-4 text-right">Quantidade</th>
                <th className="py-2.5 pl-4 text-right">Valor Esperado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {summary?.byPeriod.map((row) => (
                <tr key={row.period}>
                  <td className="py-3 pr-4 font-medium text-slate-800">
                    {groupBy === 'day' ? formatIsoDateToBR(row.period) : row.period}
                  </td>
                  <td className="py-3 px-4 text-right">{row.totalQuantity}</td>
                  <td className="py-3 pl-4 text-right font-semibold text-blue-600">
                    {formatCentsToBRL(row.expectedAmountCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
