import { type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import type { FeedbackMessage, Place } from '../../types/domain';
import { formatCentsToBRL } from '../../utils/currency';
import { Button } from '../ui/Button';
import { FeedbackBanner, Input } from '../ui/Input';

interface DeliveryFormProps {
  activePlaces: Place[];
  date: string;
  onDateChange: (date: string) => void;
  selectedPlaceId: number;
  onSelectPlace: (placeId: number) => void;
  quantity: string;
  onQuantityChange: (qty: string) => void;
  activePricesByPlace: Record<number, number | null>;
  currentUnitCents: number | null;
  previewTotalCents: number;
  submitting: boolean;
  feedback: FeedbackMessage | null;
  onSubmit: () => Promise<void>;
}

export function DeliveryForm({
  activePlaces,
  date,
  onDateChange,
  selectedPlaceId,
  onSelectPlace,
  quantity,
  onQuantityChange,
  activePricesByPlace,
  currentUnitCents,
  previewTotalCents,
  submitting,
  feedback,
  onSubmit,
}: DeliveryFormProps) {
  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    void onSubmit();
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Registro de Quentinhas</h2>
          <p className="text-xs text-slate-500">Selecione o destino, a data e a quantidade</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="delivery-date" className="text-xs font-medium text-slate-600">
            Data:
          </label>
          <input
            id="delivery-date"
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {activePlaces.map((place) => {
          const isSelected = place.id === selectedPlaceId;
          const unitPrice = activePricesByPlace[place.id];

          return (
            <button
              key={place.id}
              type="button"
              onClick={() => onSelectPlace(place.id)}
              className={`text-left rounded-xl border p-4 transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                  : 'border-slate-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-900">{place.name}</span>
                {isSelected && <span className="w-2 h-2 rounded-full bg-blue-600" />}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {unitPrice !== undefined && unitPrice !== null
                  ? `${formatCentsToBRL(unitPrice)} / un.`
                  : 'Sem preço nesta data'}
              </p>
            </button>
          );
        })}
      </div>

      <FeedbackBanner feedback={feedback} />

      <form
        onSubmit={handleFormSubmit}
        className="flex flex-col sm:flex-row sm:items-end gap-4 pt-2 border-t border-slate-100"
      >
        <div className="w-full sm:w-40">
          <Input
            id="quantity"
            label="Quantidade"
            type="number"
            min={1}
            required
            value={quantity}
            onChange={(e) => onQuantityChange(e.target.value)}
          />
        </div>

        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-slate-500">Valor atual</span>
          <span className="text-base font-semibold text-blue-600">
            {formatCentsToBRL(previewTotalCents)}
          </span>
        </div>

        <Button
          type="submit"
          disabled={submitting || currentUnitCents === null}
          className="px-5 py-2.5"
        >
          <Plus className="w-4 h-4" />
          <span>{submitting ? 'Salvando...' : 'Adicionar Registro'}</span>
        </Button>
      </form>
    </section>
  );
}
