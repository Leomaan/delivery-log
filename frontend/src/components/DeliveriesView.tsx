import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDeliveries } from '../hooks/useDeliveries';
import type { Place } from '../types/domain';
import { formatCentsToBRL } from '../utils/currency';
import { formatIsoDateToBR } from '../utils/date';
import { DeliveryForm } from './forms/DeliveryForm';
import { Button, InlineRowActions } from './ui/Button';
import { Select } from './ui/Input';

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

  const getPlaceName = (id: number) =>
    places.find((p) => p.id === id)?.name ?? `Local #${String(id)}`;

  const placeFilterOptions = [
    { value: '', label: 'Todos os destinos' },
    ...places.map((p) => ({ value: String(p.id), label: p.name })),
  ];

  const pageSizeOptions = [
    { value: '10', label: '10 por página' },
    { value: '20', label: '20 por página' },
    { value: '50', label: '50 por página' },
  ];

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

      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Registros Lançados</h3>
            <p className="text-xs text-slate-500">
              Total geral ({String(totalQuantity)} quentinhas em {String(total)} registros):{' '}
              <strong className="text-blue-600">{formatCentsToBRL(totalDeliveredCents)}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Select
              value={filterPlaceId}
              options={placeFilterOptions}
              onChange={(e) => changeFilterPlace(e.target.value)}
            />

            <Select
              value={String(limit)}
              options={pageSizeOptions}
              onChange={(e) => changeLimit(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                <th className="py-2.5 pr-3">Data</th>
                <th className="py-2.5 px-3">Destino</th>
                <th className="py-2.5 px-3 text-center">Qtd.</th>
                <th className="py-2.5 px-3 text-center">Unitário</th>
                <th className="py-2.5 px-3 text-center">Total</th>
                <th className="py-2.5 pl-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                deliveries.map((item) => {
                  const isEditing = editingId === item.id;
                  const isDeleting = deletingId === item.id;

                  return (
                    <tr key={item.id}>
                      <td className="py-3 pr-3 whitespace-nowrap tabular-nums">
                        {formatIsoDateToBR(item.date)}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900 truncate">
                        {getPlaceName(item.placeId)}
                      </td>
                      <td className="py-3 px-3 text-center tabular-nums">
                        {isEditing ? (
                          <input
                            type="number"
                            min={1}
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            className="w-20 rounded-lg border border-blue-600 px-2 py-1 text-center text-xs text-slate-900 focus:outline-none"
                          />
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 whitespace-nowrap tabular-nums">
                        {formatCentsToBRL(item.unitCents)}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-blue-600 whitespace-nowrap tabular-nums">
                        {formatCentsToBRL(item.totalCents)}
                      </td>
                      <td className="py-3 pl-3 text-right whitespace-nowrap">
                        <InlineRowActions
                          isEditing={isEditing}
                          isDeleting={isDeleting}
                          onStartEdit={() => startEditing(item)}
                          onConfirmEdit={() => void confirmEdit(item.id)}
                          onCancelEdit={() => setEditingId(null)}
                          onStartDelete={() => startDeleting(item.id)}
                          onConfirmDelete={() => void confirmDelete(item.id)}
                          onCancelDelete={() => setDeletingId(null)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Página <strong className="text-slate-800">{String(page)}</strong> de{' '}
              <strong className="text-slate-800">{String(totalPages)}</strong> ({String(total)}{' '}
              registros)
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                <span>Próxima</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
