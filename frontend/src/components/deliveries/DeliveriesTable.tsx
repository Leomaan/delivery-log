import type { Delivery, Place } from '../../types/domain';
import { formatCentsToBRL } from '../../utils/currency';
import { formatIsoDateToBR } from '../../utils/date';
import { InlineRowActions } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Select } from '../ui/Input';
import { Pagination } from '../ui/Pagination';

interface DeliveriesTableProps {
  deliveries: Delivery[];
  places: Place[];
  totalQuantity: number;
  totalCount: number;
  totalDeliveredCents: number;
  filterPlaceId: string;
  onFilterPlaceChange: (placeId: string) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  editingId: number | null;
  editQuantity: string;
  onEditQuantityChange: (qty: string) => void;
  deletingId: number | null;
  onStartEditing: (delivery: Delivery) => void;
  onConfirmEdit: (id: number) => Promise<void>;
  onCancelEdit: () => void;
  onStartDeleting: (id: number) => void;
  onConfirmDelete: (id: number) => Promise<void>;
  onCancelDelete: () => void;
}

const PAGE_SIZE_OPTIONS = [
  { value: '10', label: '10 por página' },
  { value: '20', label: '20 por página' },
  { value: '50', label: '50 por página' },
];

export function DeliveriesTable({
  deliveries,
  places,
  totalQuantity,
  totalCount,
  totalDeliveredCents,
  filterPlaceId,
  onFilterPlaceChange,
  limit,
  onLimitChange,
  page,
  totalPages,
  onPageChange,
  editingId,
  editQuantity,
  onEditQuantityChange,
  deletingId,
  onStartEditing,
  onConfirmEdit,
  onCancelEdit,
  onStartDeleting,
  onConfirmDelete,
  onCancelDelete,
}: DeliveriesTableProps) {
  const getPlaceName = (id: number) =>
    places.find((p) => p.id === id)?.name ?? `Local #${String(id)}`;

  const placeFilterOptions = [
    { value: '', label: 'Todos os destinos' },
    ...places.map((p) => ({ value: String(p.id), label: p.name })),
  ];

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Registros Lançados</h3>
          <p className="text-xs text-slate-500">
            Total geral ({String(totalQuantity)} quentinhas em {String(totalCount)} registros):{' '}
            <strong className="text-blue-600">{formatCentsToBRL(totalDeliveredCents)}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Select
            value={filterPlaceId}
            options={placeFilterOptions}
            onChange={(e) => onFilterPlaceChange(e.target.value)}
          />

          <Select
            value={String(limit)}
            options={PAGE_SIZE_OPTIONS}
            onChange={(e) => onLimitChange(Number(e.target.value))}
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
                <td colSpan={6} className="py-6">
                  <EmptyState message="Nenhum registro encontrado." />
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
                          onChange={(e) => onEditQuantityChange(e.target.value)}
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
                        onStartEdit={() => onStartEditing(item)}
                        onConfirmEdit={() => void onConfirmEdit(item.id)}
                        onCancelEdit={onCancelEdit}
                        onStartDelete={() => onStartDeleting(item.id)}
                        onConfirmDelete={() => void onConfirmDelete(item.id)}
                        onCancelDelete={onCancelDelete}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={totalCount}
        onPageChange={onPageChange}
      />
    </section>
  );
}
