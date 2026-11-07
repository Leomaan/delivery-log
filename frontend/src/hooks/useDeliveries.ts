import { useCallback, useEffect, useMemo, useState } from 'react';
import { httpClient } from '../lib/httpClient';
import type { Delivery, FeedbackMessage, PaginatedDeliveries, Place, Price } from '../types/domain';
import { getTodayIsoDate } from '../utils/date';
import { formatErrorToPtBr } from '../utils/error';

export function useDeliveries(places: Place[]) {
  const activePlaces = useMemo(() => places.filter((p) => p.active), [places]);

  const [date, setDate] = useState<string>(getTodayIsoDate());
  const [selectedPlaceId, setSelectedPlaceId] = useState<number>(activePlaces[0]?.id ?? 0);
  const [quantity, setQuantity] = useState<string>('1');
  const [activePricesByPlace, setActivePricesByPlace] = useState<Record<number, number | null>>({});

  // Paginação e Filtros
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [totalDeliveredCents, setTotalDeliveredCents] = useState(0);
  const [filterPlaceId, setFilterPlaceId] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  // Estado de Edição e Confirmação de Exclusão
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('1');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (selectedPlaceId === 0 && activePlaces[0]) {
      setSelectedPlaceId(activePlaces[0].id);
    }
  }, [activePlaces, selectedPlaceId]);

  const loadActivePrices = useCallback(async () => {
    const entries = await Promise.all(
      activePlaces.map(async (place) => {
        try {
          const price = await httpClient.get<Price>(
            `/places/${String(place.id)}/prices/active?date=${encodeURIComponent(date)}`,
          );
          return [place.id, price.unitCents] as const;
        } catch {
          return [place.id, null] as const;
        }
      }),
    );
    setActivePricesByPlace(Object.fromEntries(entries));
  }, [activePlaces, date]);

  const loadDeliveries = useCallback(async () => {
    const search = new URLSearchParams();
    search.set('page', String(page));
    search.set('limit', String(limit));
    if (filterPlaceId) {
      search.set('placeId', filterPlaceId);
    }

    const res = await httpClient.get<PaginatedDeliveries>(`/deliveries?${search.toString()}`);
    setDeliveries(res.items);
    setTotal(res.total);
    setTotalQuantity(res.totalQuantity);
    setTotalDeliveredCents(res.totalDeliveredCents);
  }, [page, limit, filterPlaceId]);

  useEffect(() => {
    void loadActivePrices();
  }, [loadActivePrices]);

  useEffect(() => {
    void loadDeliveries();
  }, [loadDeliveries]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentUnitCents = activePricesByPlace[selectedPlaceId] ?? null;
  const parsedQty = Number.parseInt(quantity, 10);
  const previewTotalCents =
    currentUnitCents !== null && Number.isInteger(parsedQty) && parsedQty > 0
      ? parsedQty * currentUnitCents
      : 0;

  const createDelivery = useCallback(async () => {
    if (!selectedPlaceId || !Number.isInteger(parsedQty) || parsedQty <= 0) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      await httpClient.post<Delivery>('/deliveries', {
        placeId: selectedPlaceId,
        date,
        quantity: parsedQty,
      });
      httpClient.invalidateCache('/deliveries');
      httpClient.invalidateCache('/reports');
      setQuantity('1');
      setPage(1);
      setFeedback({ type: 'success', text: 'Entrega registrada com sucesso.' });
      await loadDeliveries();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: formatErrorToPtBr(err, 'Erro ao registrar entrega.'),
      });
    } finally {
      setSubmitting(false);
    }
  }, [selectedPlaceId, parsedQty, date, loadDeliveries]);

  const confirmEdit = useCallback(
    async (id: number) => {
      const newQty = Number.parseInt(editQuantity, 10);
      if (!Number.isInteger(newQty) || newQty <= 0) return;

      try {
        await httpClient.patch<Delivery>(`/deliveries/${String(id)}`, {
          quantity: newQty,
        });
        httpClient.invalidateCache('/deliveries');
        httpClient.invalidateCache('/reports');
        setEditingId(null);
        setFeedback({
          type: 'success',
          text: 'Quantidade atualizada (mantendo o valor unitário congelado original).',
        });
        await loadDeliveries();
      } catch (err) {
        setFeedback({
          type: 'error',
          text: formatErrorToPtBr(err, 'Erro ao editar registro.'),
        });
      }
    },
    [editQuantity, loadDeliveries],
  );

  const confirmDelete = useCallback(
    async (id: number) => {
      try {
        await httpClient.delete(`/deliveries/${String(id)}`);
        httpClient.invalidateCache('/deliveries');
        httpClient.invalidateCache('/reports');
        setDeletingId(null);
        setFeedback({ type: 'success', text: 'Registro excluído com sucesso.' });
        if (deliveries.length === 1 && page > 1) {
          setPage((prev) => prev - 1);
        } else {
          await loadDeliveries();
        }
      } catch (err) {
        setFeedback({
          type: 'error',
          text: formatErrorToPtBr(err, 'Erro ao excluir registro.'),
        });
      }
    },
    [deliveries.length, page, loadDeliveries],
  );

  const startEditing = useCallback((item: Delivery) => {
    setDeletingId(null);
    setEditingId(item.id);
    setEditQuantity(String(item.quantity));
  }, []);

  const startDeleting = useCallback((id: number) => {
    setEditingId(null);
    setDeletingId(id);
  }, []);

  const changeFilterPlace = useCallback((value: string) => {
    setFilterPlaceId(value);
    setPage(1);
  }, []);

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  return {
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
  };
}
