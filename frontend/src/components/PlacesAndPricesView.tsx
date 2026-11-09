import { usePlacesManager } from '../hooks/usePlaces';
import type { Place } from '../types/domain';
import { PlacesList } from './places/PlacesList';
import { PriceHistory } from './places/PriceHistory';

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

  const selectedPlace = places.find((p) => p.id === selectedPlaceId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5">
        <PlacesList
          places={places}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={setSelectedPlaceId}
          newPlaceName={newPlaceName}
          onNewPlaceNameChange={setNewPlaceName}
          onCreatePlace={createPlace}
          editingPlaceId={editingPlaceId}
          editingPlaceName={editingPlaceName}
          onEditingPlaceNameChange={setEditingPlaceName}
          deletingPlaceId={deletingPlaceId}
          onStartEditingPlace={startEditingPlace}
          onConfirmEditPlace={confirmEditPlace}
          onCancelEditPlace={() => setEditingPlaceId(null)}
          onStartDeletingPlace={startDeletingPlace}
          onConfirmDeletePlace={confirmDeletePlace}
          onCancelDeletePlace={() => setDeletingPlaceId(null)}
          onTogglePlaceActive={togglePlaceActive}
        />
      </div>

      <div className="lg:col-span-7">
        <PriceHistory
          selectedPlace={selectedPlace}
          prices={prices}
          newPriceReais={newPriceReais}
          onNewPriceReaisChange={setNewPriceReais}
          validFrom={validFrom}
          onValidFromChange={setValidFrom}
          message={message}
          onCreatePrice={createPrice}
        />
      </div>
    </div>
  );
}
