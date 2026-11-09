import type { Place } from '../../types/domain';
import { formatCentsToBRL } from '../../utils/currency';

interface PlaceCardsSelectorProps {
  places: Place[];
  selectedPlaceId: number;
  onSelectPlace: (placeId: number) => void;
  activePricesByPlace: Record<number, number | null>;
}

export function PlaceCardsSelector({
  places,
  selectedPlaceId,
  onSelectPlace,
  activePricesByPlace,
}: PlaceCardsSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
      {places.map((place) => {
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
  );
}
