import { usePlacesManager } from '../hooks/usePlaces';
import type { Place } from '../types/domain';
import { formatCentsToBRL } from '../utils/currency';
import { formatIsoDateToBR } from '../utils/date';
import { PlaceForm } from './forms/PlaceForm';
import { PriceForm } from './forms/PriceForm';
import { InlineRowActions } from './ui/Button';
import { FeedbackBanner } from './ui/Input';

interface PlacesAndPricesViewProps {
  places: Place[];
  onPlacesChanged: () => Promise<void>;
}

export function PlacesAndPricesView({ places, onPlacesChanged }: PlacesAndPricesViewProps) {
  const {
    newPlaceName,
    setNewPlaceName,
    selectedPlaceId,
    setSelectedPlaceId,
    prices,
    newPriceReais,
    setNewPriceReais,
    validFrom,
    setValidFrom,
    message,
    editingPlaceId,
    setEditingPlaceId,
    editingPlaceName,
    setEditingPlaceName,
    deletingPlaceId,
    setDeletingPlaceId,
    startEditingPlace,
    confirmEditPlace,
    startDeletingPlace,
    confirmDeletePlace,
    createPlace,
    createPrice,
    togglePlaceActive,
  } = usePlacesManager(places, onPlacesChanged);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Destinos e Instituições</h2>
        <p className="text-xs text-slate-500 mb-4">
          Cadastre, edite ou exclua os destinos atendidos (ex.: Prefeitura, Saúde, Fórum, Mutirão).
        </p>

        <PlaceForm value={newPlaceName} onChange={setNewPlaceName} onSubmit={createPlace} />

        <div className="space-y-2">
          {places.map((place) => {
            const isSelected = place.id === selectedPlaceId;
            const isEditing = editingPlaceId === place.id;
            const isDeleting = deletingPlaceId === place.id;

            return (
              <div
                key={place.id}
                onClick={() => setSelectedPlaceId(place.id)}
                className={`rounded-lg border px-3.5 py-2.5 cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div
                  className="flex items-center justify-between gap-2"
                  onClick={(e) => {
                    if (isEditing || isDeleting) e.stopPropagation();
                  }}
                >
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingPlaceName}
                      onChange={(e) => setEditingPlaceName(e.target.value)}
                      className="flex-1 rounded-lg border border-blue-600 bg-white px-2.5 py-1 text-xs text-slate-900 focus:outline-none"
                    />
                  ) : (
                    <div>
                      <span className="text-sm font-medium text-slate-900">{place.name}</span>
                      {!place.active && (
                        <span className="ml-2 text-xs text-slate-400">(Inativo)</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                    {!isEditing && !isDeleting && (
                      <button
                        type="button"
                        onClick={() => void togglePlaceActive(place)}
                        className="text-xs text-blue-600 hover:underline cursor-pointer"
                      >
                        {place.active ? 'Desativar' : 'Ativar'}
                      </button>
                    )}

                    <InlineRowActions
                      isEditing={isEditing}
                      isDeleting={isDeleting}
                      onStartEdit={() => startEditingPlace(place)}
                      onConfirmEdit={() => void confirmEditPlace(place.id)}
                      onCancelEdit={() => setEditingPlaceId(null)}
                      onStartDelete={() => startDeletingPlace(place.id)}
                      onConfirmDelete={() => void confirmDeletePlace(place.id)}
                      onCancelDelete={() => setDeletingPlaceId(null)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-base font-semibold text-slate-900">
            Valores — {places.find((p) => p.id === selectedPlaceId)?.name ?? ''}
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Definir o valor e a data para entrar em vigor.
        </p>

        <FeedbackBanner feedback={message} />

        <PriceForm
          newPriceReais={newPriceReais}
          onChangePriceReais={setNewPriceReais}
          validFrom={validFrom}
          onChangeValidFrom={setValidFrom}
          disabled={!selectedPlaceId}
          onSubmit={createPrice}
        />

        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Histórico de Valores deste Destino
        </h3>
        <div className="divide-y divide-slate-100">
          {prices.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">Nenhum valor cadastrado ainda.</p>
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
    </div>
  );
}
