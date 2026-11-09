import type { Place } from '../../types/domain';
import { PlaceForm } from '../forms/PlaceForm';
import { InlineRowActions } from '../ui/Button';

interface PlacesListProps {
  places: Place[];
  selectedPlaceId: number;
  onSelectPlace: (placeId: number) => void;
  newPlaceName: string;
  onNewPlaceNameChange: (name: string) => void;
  onCreatePlace: () => Promise<void>;
  editingPlaceId: number | null;
  editingPlaceName: string;
  onEditingPlaceNameChange: (name: string) => void;
  deletingPlaceId: number | null;
  onStartEditingPlace: (place: Place) => void;
  onConfirmEditPlace: (id: number) => Promise<void>;
  onCancelEditPlace: () => void;
  onStartDeletingPlace: (id: number) => void;
  onConfirmDeletePlace: (id: number) => Promise<void>;
  onCancelDeletePlace: () => void;
  onTogglePlaceActive: (place: Place) => Promise<void>;
}

export function PlacesList({
  places,
  selectedPlaceId,
  onSelectPlace,
  newPlaceName,
  onNewPlaceNameChange,
  onCreatePlace,
  editingPlaceId,
  editingPlaceName,
  onEditingPlaceNameChange,
  deletingPlaceId,
  onStartEditingPlace,
  onConfirmEditPlace,
  onCancelEditPlace,
  onStartDeletingPlace,
  onConfirmDeletePlace,
  onCancelDeletePlace,
  onTogglePlaceActive,
}: PlacesListProps) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6">
      <h2 className="text-base font-semibold text-slate-900 mb-1">Destinos e Instituições</h2>
      <p className="text-xs text-slate-500 mb-4">
        Cadastre, edite ou exclua os destinos atendidos (ex.: Prefeitura, Saúde, Fórum, Mutirão).
      </p>

      <PlaceForm value={newPlaceName} onChange={onNewPlaceNameChange} onSubmit={onCreatePlace} />

      <div className="space-y-2">
        {places.map((place) => {
          const isSelected = place.id === selectedPlaceId;
          const isEditing = editingPlaceId === place.id;
          const isDeleting = deletingPlaceId === place.id;

          return (
            <div
              key={place.id}
              onClick={() => onSelectPlace(place.id)}
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
                    onChange={(e) => onEditingPlaceNameChange(e.target.value)}
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
                      onClick={() => void onTogglePlaceActive(place)}
                      className="text-xs text-blue-600 hover:underline cursor-pointer"
                    >
                      {place.active ? 'Desativar' : 'Ativar'}
                    </button>
                  )}

                  <InlineRowActions
                    isEditing={isEditing}
                    isDeleting={isDeleting}
                    onStartEdit={() => onStartEditingPlace(place)}
                    onConfirmEdit={() => void onConfirmEditPlace(place.id)}
                    onCancelEdit={onCancelEditPlace}
                    onStartDelete={() => onStartDeletingPlace(place.id)}
                    onConfirmDelete={() => void onConfirmDeletePlace(place.id)}
                    onCancelDelete={onCancelDeletePlace}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
