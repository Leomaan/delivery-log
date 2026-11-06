import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Plus, Tag } from 'lucide-react';
import { api, type Place, type Price } from '../lib/api';
import {
  formatCentsToBRL,
  formatIsoDateToBR,
  getTodayIsoDate,
  parseReaisInputToCents,
} from '../lib/money';

interface PlacesAndPricesViewProps {
  places: Place[];
  onPlacesChanged: () => Promise<void>;
}

export function PlacesAndPricesView({ places, onPlacesChanged }: PlacesAndPricesViewProps) {
  const [newPlaceName, setNewPlaceName] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState<number>(places[0]?.id ?? 0);
  const [prices, setPrices] = useState<Price[]>([]);
  const [newPriceReais, setNewPriceReais] = useState('');
  const [validFrom, setValidFrom] = useState(getTodayIsoDate());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (selectedPlaceId === 0 && places[0]) {
      setSelectedPlaceId(places[0].id);
    }
  }, [places, selectedPlaceId]);

  const loadPrices = useCallback(async () => {
    if (!selectedPlaceId) return;
    const res = await api.listPrices(selectedPlaceId);
    setPrices(res.items);
  }, [selectedPlaceId]);

  useEffect(() => {
    void loadPrices();
  }, [loadPrices]);

  const handleCreatePlace = async (event: FormEvent) => {
    event.preventDefault();
    if (newPlaceName.trim().length < 2) return;
    setMessage(null);

    try {
      const created = await api.createPlace(newPlaceName.trim());
      setNewPlaceName('');
      await onPlacesChanged();
      setSelectedPlaceId(created.id);
      setMessage({ type: 'success', text: `Tipo "${created.name}" criado com sucesso.` });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao criar tipo',
      });
    }
  };

  const handleCreatePrice = async (event: FormEvent) => {
    event.preventDefault();
    const unitCents = parseReaisInputToCents(newPriceReais);
    if (!selectedPlaceId || unitCents === null) {
      setMessage({ type: 'error', text: 'Informe um valor válido em Reais (ex: 18,50)' });
      return;
    }

    setMessage(null);
    try {
      await api.createPrice(selectedPlaceId, {
        unitCents,
        validFrom,
      });
      setNewPriceReais('');
      await loadPrices();
      setMessage({
        type: 'success',
        text: 'Novo valor cadastrado! Os próximos registros a partir desta data já usarão este valor.',
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao atualizar preço',
      });
    }
  };

  const handleTogglePlaceActive = async (place: Place) => {
    await api.updatePlace(place.id, { active: !place.active });
    await onPlacesChanged();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Coluna Esquerda: Tipos (Prefeitura, Saúde, Fórum...) */}
      <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Tipos de Quentinha</h2>
        <p className="text-xs text-slate-500 mb-4">
          Cadastre os destinos/tipos (ex.: Prefeitura, Saúde, Fórum).
        </p>

        <form onSubmit={(e) => void handleCreatePlace(e)} className="flex gap-2 mb-5">
          <input
            type="text"
            placeholder="Novo tipo (ex: Educação)"
            value={newPlaceName}
            onChange={(e) => setNewPlaceName(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar</span>
          </button>
        </form>

        <div className="space-y-2">
          {places.map((place) => {
            const isSelected = place.id === selectedPlaceId;
            return (
              <div
                key={place.id}
                onClick={() => setSelectedPlaceId(place.id)}
                className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div>
                  <span className="text-sm font-medium text-slate-900">{place.name}</span>
                  {!place.active && (
                    <span className="ml-2 text-xs text-slate-400">(Inativo)</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleTogglePlaceActive(place);
                  }}
                  className="text-xs text-blue-600 hover:underline cursor-pointer"
                >
                  {place.active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Coluna Direita: Preços e Vigência por Data */}
      <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <Tag className="w-4 h-4 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">
            Valores e Reajustes — {places.find((p) => p.id === selectedPlaceId)?.name ?? ''}
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Ao definir um novo valor e data de início, o valor anterior é encerrado automaticamente um
          dia antes, preservando todos os registros passados.
        </p>

        {message && (
          <div
            className={`mb-4 rounded-lg border px-3 py-2 text-xs ${
              message.type === 'success'
                ? 'border-blue-200 bg-blue-50 text-blue-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <form
          onSubmit={(e) => void handleCreatePrice(e)}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-5 mb-5 border-b border-slate-100"
        >
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Valor Unitário (R$)
            </label>
            <input
              type="text"
              placeholder="Ex: 19,50"
              required
              value={newPriceReais}
              onChange={(e) => setNewPriceReais(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Válido a partir de
            </label>
            <input
              type="date"
              required
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 text-sm transition-colors cursor-pointer"
            >
              Definir Valor
            </button>
          </div>
        </form>

        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Histórico de Valores deste Tipo
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
