import type { ReportSummary } from '../../types/domain';
import { formatCentsToBRL } from '../../utils/currency';
import { EmptyState } from '../ui/EmptyState';

interface ReportPlacesBreakdownProps {
  summary: ReportSummary | null;
  activeRangeLabel: string;
}

export function ReportPlacesBreakdown({ summary, activeRangeLabel }: ReportPlacesBreakdownProps) {
  const byPlace = summary?.byPlace ?? [];

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">Resumo por Destino</h3>
        <p className="text-xs text-slate-500">
          Quanto cada local pediu e quanto deve ser cobrado no período selecionado
        </p>
      </div>

      {byPlace.length === 0 ? (
        <EmptyState
          message={
            <span>
              Nenhuma entrega registrada em <strong>{activeRangeLabel}</strong>.
            </span>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {byPlace.map((placeItem) => {
            const totalCents = summary?.expectedAmountCents || 1;
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
  );
}
