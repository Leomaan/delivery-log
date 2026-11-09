import type { FeedbackMessage, Place, Price } from '../../types/domain';
import { formatCentsToBRL } from '../../utils/currency';
import { formatIsoDateToBR } from '../../utils/date';
import { PriceForm } from '../forms/PriceForm';
import { EmptyState } from '../ui/EmptyState';
import { FeedbackBanner } from '../ui/Input';

interface PriceHistoryProps {
  selectedPlace: Place | undefined;
  prices: Price[];
  newPriceReais: string;
  onNewPriceReaisChange: (price: string) => void;
  validFrom: string;
  onValidFromChange: (date: string) => void;
  message: FeedbackMessage | null;
  onCreatePrice: () => Promise<void>;
}

export function PriceHistory({
  selectedPlace,
  prices,
  newPriceReais,
  onNewPriceReaisChange,
  validFrom,
  onValidFromChange,
  message,
  onCreatePrice,
}: PriceHistoryProps) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-base font-semibold text-slate-900">
          Valores — {selectedPlace?.name ?? 'Nenhum destino selecionado'}
        </h2>
      </div>
      <p className="text-xs text-slate-500 mb-4">Definir o valor e a data para entrar em vigor.</p>

      <FeedbackBanner feedback={message} />

      <PriceForm
        newPriceReais={newPriceReais}
        onChangePriceReais={onNewPriceReaisChange}
        validFrom={validFrom}
        onChangeValidFrom={onValidFromChange}
        disabled={!selectedPlace}
        onSubmit={onCreatePrice}
      />

      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
        Histórico de Valores deste Destino
      </h3>

      <div className="divide-y divide-slate-100">
        {prices.length === 0 ? (
          <EmptyState
            message="Nenhum valor cadastrado ainda."
            description="Cadastre o primeiro valor acima para que as entregas possam ser registradas."
          />
        ) : (
          prices.map((price) => (
            <div key={price.id} className="py-2.5 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-900">
                {formatCentsToBRL(price.unitCents)}
              </span>
              <span className="text-xs text-slate-500">
                De {formatIsoDateToBR(price.validFrom)}{' '}
                {price.validTo ? (
                  `até ${formatIsoDateToBR(price.validTo)}`
                ) : (
                  <strong className="text-blue-600 font-medium">(Vigente atual)</strong>
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
