import { useCallback, useEffect, useState } from 'react';
import { httpClient } from '../lib/httpClient';
import type { FeedbackMessage, Place, Price } from '../types/domain';
import { parseReaisInputToCents } from '../utils/currency';
import { getTodayIsoDate } from '../utils/date';
import { formatErrorToPtBr } from '../utils/error';

export function usePlacesList(enabled: boolean) {
  const [places, setPlaces] = useState<Place[]>([]);

  const reloadPlaces = useCallback(async () => {
    const res = await httpClient.get<{ items: Place[] }>('/places');
    setPlaces(res.items);
  }, []);

  useEffect(() => {
    if (enabled) {
      void reloadPlaces();
    }
  }, [enabled, reloadPlaces]);

  return {
    places,
    reloadPlaces,
  };
}

export function usePlacesManager(places: Place[], onPlacesChanged: () => Promise<void>) {
  const [newPlaceName, setNewPlaceName] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState<number>(places[0]?.id ?? 0);
  const [prices, setPrices] = useState<Price[]>([]);
  const [newPriceReais, setNewPriceReais] = useState('');
  const [validFrom, setValidFrom] = useState(getTodayIsoDate());
  const [message, setMessage] = useState<FeedbackMessage | null>(null);

  // Estado de Edição e Confirmação de Exclusão de Destino
  const [editingPlaceId, setEditingPlaceId] = useState<number | null>(null);
  const [editingPlaceName, setEditingPlaceName] = useState('');
  const [deletingPlaceId, setDeletingPlaceId] = useState<number | null>(null);

  useEffect(() => {
    if (places.length === 0) {
      setSelectedPlaceId(0);
      setPrices([]);
      return;
    }
    if (!places.some((p) => p.id === selectedPlaceId)) {
      setSelectedPlaceId(places[0]?.id ?? 0);
    }
  }, [places, selectedPlaceId]);

  const loadPrices = useCallback(async () => {
    if (!selectedPlaceId) {
      setPrices([]);
      return;
    }
    const res = await httpClient.get<{ items: Price[] }>(
      `/places/${String(selectedPlaceId)}/prices`,
    );
    setPrices(res.items);
  }, [selectedPlaceId]);

  useEffect(() => {
    void loadPrices();
  }, [loadPrices]);

  const createPlace = useCallback(async () => {
    const trimmed = newPlaceName.trim();
    if (trimmed.length < 2) return;
    setMessage(null);

    try {
      const created = await httpClient.post<Place>('/places', { name: trimmed });
      httpClient.invalidateCache('/places');
      setNewPlaceName('');
      await onPlacesChanged();
      setSelectedPlaceId(created.id);
      setMessage({ type: 'success', text: `Destino "${created.name}" criado com sucesso.` });
    } catch (err) {
      setMessage({
        type: 'error',
        text: formatErrorToPtBr(err, 'Erro ao criar destino.'),
      });
    }
  }, [newPlaceName, onPlacesChanged]);

  const startEditingPlace = useCallback((place: Place) => {
    setDeletingPlaceId(null);
    setEditingPlaceId(place.id);
    setEditingPlaceName(place.name);
  }, []);

  const confirmEditPlace = useCallback(
    async (id: number) => {
      const trimmed = editingPlaceName.trim();
      if (trimmed.length < 2) return;
      setMessage(null);

      try {
        await httpClient.patch<Place>(`/places/${String(id)}`, { name: trimmed });
        httpClient.invalidateCache('/places');
        httpClient.invalidateCache('/reports');
        setEditingPlaceId(null);
        await onPlacesChanged();
        setMessage({ type: 'success', text: 'Nome do destino atualizado com sucesso.' });
      } catch (err) {
        setMessage({
          type: 'error',
          text: formatErrorToPtBr(err, 'Erro ao editar destino.'),
        });
      }
    },
    [editingPlaceName, onPlacesChanged],
  );

  const startDeletingPlace = useCallback((id: number) => {
    setEditingPlaceId(null);
    setDeletingPlaceId(id);
  }, []);

  const confirmDeletePlace = useCallback(
    async (id: number) => {
      setMessage(null);
      try {
        await httpClient.delete(`/places/${String(id)}`);
        httpClient.invalidateCache('/places');
        httpClient.invalidateCache('/deliveries');
        httpClient.invalidateCache('/reports');
        setDeletingPlaceId(null);
        await onPlacesChanged();
        setMessage({ type: 'success', text: 'Destino excluído com sucesso.' });
      } catch (err) {
        setMessage({
          type: 'error',
          text: formatErrorToPtBr(err, 'Erro ao excluir destino.'),
        });
      }
    },
    [onPlacesChanged],
  );

  const createPrice = useCallback(async () => {
    const unitCents = parseReaisInputToCents(newPriceReais);
    if (!selectedPlaceId || unitCents === null) {
      setMessage({ type: 'error', text: 'Informe um valor válido em Reais (ex: 18,50)' });
      return;
    }

    setMessage(null);
    try {
      await httpClient.post<Price>(`/places/${String(selectedPlaceId)}/prices`, {
        unitCents,
        validFrom,
      });
      httpClient.invalidateCache(`/places/${String(selectedPlaceId)}/prices`);
      setNewPriceReais('');
      await loadPrices();
      setMessage({
        type: 'success',
        text: 'Novo valor cadastrado! Os próximos registros a partir desta data já usarão este valor.',
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: formatErrorToPtBr(err, 'Erro ao atualizar preço.'),
      });
    }
  }, [newPriceReais, selectedPlaceId, validFrom, loadPrices]);

  const togglePlaceActive = useCallback(
    async (place: Place) => {
      await httpClient.patch<Place>(`/places/${String(place.id)}`, {
        active: !place.active,
      });
      httpClient.invalidateCache('/places');
      await onPlacesChanged();
    },
    [onPlacesChanged],
  );

  return {
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
  };
}
