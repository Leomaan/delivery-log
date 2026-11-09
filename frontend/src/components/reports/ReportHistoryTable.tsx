import type { PeriodReportSummaryItem } from '../../types/domain';
import { formatCentsToBRL } from '../../utils/currency';
import { formatPeriodRowLabel } from '../../utils/date';
import { Button } from '../ui/Button';

interface ReportHistoryTableProps {
  tableGroupBy: 'day' | 'month';
  onTableGroupByChange: (mode: 'day' | 'month') => void;
  sortedPeriods: PeriodReportSummaryItem[];
}

export function ReportHistoryTable({
  tableGroupBy,
  onTableGroupByChange,
  sortedPeriods,
}: ReportHistoryTableProps) {
  return (
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
            onClick={() => onTableGroupByChange('day')}
          >
            Ver por Dia
          </Button>
          <Button
            variant="tab"
            size="sm"
            active={tableGroupBy === 'month'}
            onClick={() => onTableGroupByChange('month')}
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
  );
}
