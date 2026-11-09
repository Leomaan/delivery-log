import type { ReportSummary } from '../../types/domain';
import { formatCentsToBRL } from '../../utils/currency';
import { StatCard } from '../ui/StatCard';

interface ReportSummaryCardsProps {
  summary: ReportSummary | null;
  loading: boolean;
  activeRangeLabel: string;
}

export function ReportSummaryCards({
  summary,
  loading,
  activeRangeLabel,
}: ReportSummaryCardsProps) {
  const totalQuantityText = loading ? '...' : `${String(summary?.totalQuantity ?? 0)} un.`;
  const totalAmountText = loading ? '...' : formatCentsToBRL(summary?.expectedAmountCents ?? 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <StatCard
        label="Total de Quentinhas Entregues"
        value={totalQuantityText}
        subtext={activeRangeLabel}
        variant="default"
      />

      <StatCard
        label="Valor Total a Receber"
        value={totalAmountText}
        subtext="Calculado com o preço vigente de cada entrega"
        variant="primary"
      />
    </div>
  );
}
