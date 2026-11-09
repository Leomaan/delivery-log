import { useDeliveries } from '../hooks/useDeliveries';
import type { Place } from '../types/domain';
import { DeliveriesTable } from './deliveries/DeliveriesTable';
import { DeliveryForm } from './forms/DeliveryForm';

interface DeliveriesViewProps {
  places: Place[];
}

export function DeliveriesView({ places }: DeliveriesViewProps) {
  const {
    activePlaces,
    date,
    setDate,
    selectedPlaceId,
    setSelectedPlaceId,
    quantity,
    setQuantity,
    activePricesByPlace,
    page,
    setPage,
    limit,
    changeLimit,
    total,
    totalPages,
    deliveries,
    totalQuantity,
    totalDeliveredCents,
    filterPlaceId,
    changeFilterPlace,
    submitting,
    feedback,
    currentUnitCents,
    previewTotalCents,
    editingId,
    setEditingId,
    editQuantity,
    setEditQuantity,
    deletingId,
    setDeletingId,
    startEditing,
    startDeleting,
    createDelivery,
    confirmEdit,
    confirmDelete,
  } = useDeliveries(places);

  return (
    <div className="space-y-6">
      <DeliveryForm
        activePlaces={activePlaces}
        date={date}
        onDateChange={setDate}
        selectedPlaceId={selectedPlaceId}
        onSelectPlace={setSelectedPlaceId}
        quantity={quantity}
        onQuantityChange={setQuantity}
        activePricesByPlace={activePricesByPlace}
        currentUnitCents={currentUnitCents}
        previewTotalCents={previewTotalCents}
        submitting={submitting}
        feedback={feedback}
        onSubmit={createDelivery}
      />

      <DeliveriesTable
        deliveries={deliveries}
        places={places}
        totalQuantity={totalQuantity}
        totalCount={total}
        totalDeliveredCents={totalDeliveredCents}
        filterPlaceId={filterPlaceId}
        onFilterPlaceChange={changeFilterPlace}
        limit={limit}
        onLimitChange={changeLimit}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        editingId={editingId}
        editQuantity={editQuantity}
        onEditQuantityChange={setEditQuantity}
        deletingId={deletingId}
        onStartEditing={startEditing}
        onConfirmEdit={confirmEdit}
        onCancelEdit={() => setEditingId(null)}
        onStartDeleting={startDeleting}
        onConfirmDelete={confirmDelete}
        onCancelDelete={() => setDeletingId(null)}
      />
    </div>
  );
}
