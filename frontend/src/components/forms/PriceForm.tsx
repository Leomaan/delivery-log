import { type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface PriceFormProps {
  newPriceReais: string;
  onChangePriceReais: (value: string) => void;
  validFrom: string;
  onChangeValidFrom: (date: string) => void;
  disabled: boolean;
  onSubmit: () => Promise<void>;
}

export function PriceForm({
  newPriceReais,
  onChangePriceReais,
  validFrom,
  onChangeValidFrom,
  disabled,
  onSubmit,
}: PriceFormProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-5 mb-5 border-b border-slate-100"
    >
      <Input
        label="Valor Unitário (R$)"
        type="text"
        placeholder="Ex: 19,50"
        required
        value={newPriceReais}
        onChange={(e) => onChangePriceReais(e.target.value)}
      />

      <Input
        label="Válido a partir de"
        type="date"
        required
        value={validFrom}
        onChange={(e) => onChangeValidFrom(e.target.value)}
      />

      <div className="flex items-end">
        <Button type="submit" fullWidth disabled={disabled}>
          Definir Valor
        </Button>
      </div>
    </form>
  );
}
