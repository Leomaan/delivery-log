import { type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface PlaceFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => Promise<void>;
}

export function PlaceForm({ value, onChange, onSubmit }: PlaceFormProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-5">
      <div className="flex-1">
        <Input
          type="text"
          placeholder="Novo destino (ex: Mutirão)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <Button type="submit">
        <Plus className="w-4 h-4" />
        <span>Criar</span>
      </Button>
    </form>
  );
}
