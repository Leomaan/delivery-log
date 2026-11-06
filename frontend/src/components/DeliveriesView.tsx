import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Ban, CheckCircle2, Pencil, Plus } from 'lucide-react';
import { api, type Delivery, type Place } from '../lib/api';
import { formatCentsToBRL, formatIsoDateToBR, getTodayIsoDate } from '../lib/money';

const CANCEL_REASONS = [
  'Confusão no lançamento',
  'Reembolso / Estorno',
  'Quantidade incorreta',
  'Tipo/Destino incorreto',
  'Pedido cancelado',
] as const;

interface DeliveriesViewProps {
  places: Place[];
}

export function DeliveriesView({ places }: DeliveriesViewProps) {
  const activePlaces = useMemo(() => places.filter((p) => p.active), [places]);

  const [date, setDate] = useState<string>(getTodayIsoDate());
  const [selectedPlaceId, setSelectedPlaceId] = useState<number>(activePlaces[0]?.id ?? 0);
  const [quantity, setQuantity] = useState<string>('1');
  const [activePricesByPlace, setActivePricesByPlace] = useState<Record<number, number | null>>({});

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [totalDeliveredCents, setTotalDeliveredCents] = useState(0);
  const [filterPlaceId, setFilterPlaceId] = useState<string>('');
  const [includeCanceled, setIncludeCanceled] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  // Estado de Edição de quantidade
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('1');

  // Estado de Cancelamento com Dropdown de motivos
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState<string>(CANCEL_REASONS[0]);

  useEffect(() => {
    if (selectedPlaceId === 0 && activePlaces[0]) {
      setSelectedPlaceId(activePlaces[0].id);
    }
  }, [activePlaces, selectedPlaceId]);

  const loadActivePrices = useCallback(async () => {
    const entries = await Promise.all(
      activePlaces.map(async (place) => {
        const price = await api.getActivePrice(place.id, date);
        return [place.id, price ? price.unitCents : null] as const;
      }),
    );
    setActivePricesByPlace(Object.fromEntries(entries));
  }, [activePlaces, date]);

  const loadDeliveries = useCallback(async () => {
    const res = await api.listDeliveries({
      placeId: filterPlaceId ? Number(filterPlaceId) : undefined,
      includeCanceled,
    });
    setDeliveries(res.items);
    setTotalQuantity(res.totalQuantity);
    setTotalDeliveredCents(res.totalDeliveredCents);
  }, [filterPlaceId, includeCanceled]);

  useEffect(() => {
    void loadActivePrices();
  }, [loadActivePrices]);

  useEffect(() => {
    void loadDeliveries();
  }, [loadDeliveries]);

  const currentUnitCents = activePricesByPlace[selectedPlaceId] ?? null;
  const parsedQty = Number.parseInt(quantity, 10);
  const previewTotalCents =
    currentUnitCents !== null && Number.isInteger(parsedQty) && parsedQty > 0
      ? parsedQty * currentUnitCents
      : 0;

  const handleCreateDelivery = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedPlaceId || !Number.isInteger(parsedQty) || parsedQty <= 0) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      await api.createDelivery({
        placeId: selectedPlaceId,
        date,
        quantity: parsedQty,
      });
      setQuantity('1');
      setFeedback({ type: 'success', text: 'Entrega registrada com sucesso.' });
      await loadDeliveries();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao registrar entrega',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmEdit = async (id: number) => {
    const newQty = Number.parseInt(editQuantity, 10);
    if (!Number.isInteger(newQty) || newQty <= 0) return;

    try {
      await api.updateDelivery(id, newQty);
      setEditingId(null);
      setFeedback({
        type: 'success',
        text: 'Quantidade atualizada (mantendo o valor unitário congelado original).',
      });
      await loadDeliveries();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao editar registro',
      });
    }
  };

  const handleConfirmCancel = async (id: number) => {
    if (cancelReason.trim().length < 3) return;
    try {
      await api.cancelDelivery(id, cancelReason.trim());
      setCancelingId(null);
      setCancelReason(CANCEL_REASONS[0]);
      await loadDeliveries();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao cancelar registro',
      });
    }
  };

  const getPlaceName = (id: number) =>
    places.find((p) => p.id === id)?.name ?? `Local #${String(id)}`;

  return (
    <div className="space-y-6">
      {/* Lançamento Rápido */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Novo Registro de Quentinhas</h2>
            <p className="text-xs text-slate-500">
              Selecione o destino, a data e a quantidade. O preço vigente será congelado no
              registro.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="delivery-date" className="text-xs font-medium text-slate-600">
              Data:
            </label>
            <input
              id="delivery-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Seleção rápida de Tipo (Prefeitura, Saúde, Fórum...) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {activePlaces.map((place) => {
            const isSelected = place.id === selectedPlaceId;
            const unitPrice = activePricesByPlace[place.id];

            return (
              <button
                key={place.id}
                type="button"
                onClick={() => setSelectedPlaceId(place.id)}
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

        {feedback && (
          <div
            className={`mb-4 rounded-lg border px-3 py-2 text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'border-blue-200 bg-blue-50 text-blue-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback.text}</span>
          </div>
        )}

        <form
          onSubmit={(e) => void handleCreateDelivery(e)}
          className="flex flex-col sm:flex-row sm:items-end gap-4 pt-2 border-t border-slate-100"
        >
          <div className="w-full sm:w-40">
            <label htmlFor="quantity" className="block text-xs font-medium text-slate-700 mb-1">
              Quantidade
            </label>
            <input
              id="quantity"
              type="number"
              min={1}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">Valor congelado deste lançamento:</span>
            <span className="text-base font-semibold text-blue-600">
              {formatCentsToBRL(previewTotalCents)}
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting || currentUnitCents === null}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium px-5 py-2.5 text-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{submitting ? 'Salvando...' : 'Adicionar Registro'}</span>
          </button>
        </form>
      </section>

      {/* Histórico de Lançamentos */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Registros Lançados</h3>
            <p className="text-xs text-slate-500">
              Total listado ({String(totalQuantity)} quentinhas):{' '}
              <strong className="text-blue-600">{formatCentsToBRL(totalDeliveredCents)}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterPlaceId}
              onChange={(e) => setFilterPlaceId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-blue-600 focus:outline-none"
            >
              <option value="">Todos os tipos</option>
              {places.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </select>

            <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCanceled}
                onChange={(e) => setIncludeCanceled(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
              Mostrar cancelados
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                <th className="py-2.5 pr-4">Data</th>
                <th className="py-2.5 px-4">Tipo / Destino</th>
                <th className="py-2.5 px-4 text-right">Qtd.</th>
                <th className="py-2.5 px-4 text-right">Unitário (Congelado)</th>
                <th className="py-2.5 px-4 text-right">Total</th>
                <th className="py-2.5 pl-4 text-right">Ações</th>
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
                  const isCanceled = item.canceledAt !== null;
                  const isEditing = editingId === item.id;
                  const isCanceling = cancelingId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={isCanceled ? 'bg-slate-50 text-slate-400 line-through' : ''}
                    >
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {formatIsoDateToBR(item.date)}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {getPlaceName(item.placeId)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            min={1}
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            className="w-20 rounded-lg border border-blue-600 px-2 py-1 text-right text-xs text-slate-900 focus:outline-none"
                          />
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {formatCentsToBRL(item.unitCents)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-blue-600">
                        {formatCentsToBRL(item.totalCents)}
                      </td>
                      <td className="py-3 pl-4 text-right">
                        {isCanceled ? (
                          <span className="text-xs text-slate-400 no-underline">
                            Cancelado ({item.cancelReason})
                          </span>
                        ) : isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => void handleConfirmEdit(item.id)}
                              className="rounded-lg bg-blue-600 hover:bg-blue-700 px-2.5 py-1 text-xs font-medium text-white cursor-pointer"
                            >
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="rounded-lg border border-slate-200 hover:bg-slate-50 px-2 py-1 text-xs text-slate-600 cursor-pointer"
                            >
                              Voltar
                            </button>
                          </div>
                        ) : isCanceling ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <select
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 focus:border-blue-600 focus:outline-none"
                            >
                              {CANCEL_REASONS.map((reason) => (
                                <option key={reason} value={reason}>
                                  {reason}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => void handleConfirmCancel(item.id)}
                              className="rounded-lg bg-blue-600 hover:bg-blue-700 px-2.5 py-1 text-xs font-medium text-white cursor-pointer"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCancelingId(null);
                                setCancelReason(CANCEL_REASONS[0]);
                              }}
                              className="rounded-lg border border-slate-200 hover:bg-slate-50 px-2 py-1 text-xs text-slate-600 cursor-pointer"
                            >
                              Voltar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setCancelingId(null);
                                setEditingId(item.id);
                                setEditQuantity(String(item.quantity));
                              }}
                              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setCancelingId(item.id);
                                setCancelReason(CANCEL_REASONS[0]);
                              }}
                              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Cancelar</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
