import { type FormEvent, useState } from 'react';
import type { AuthUser } from '../../types/domain';
import { formatErrorToPtBr } from '../../utils/error';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<AuthUser>;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('admin@ponto10.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(formatErrorToPtBr(err, 'Falha ao autenticar.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <Input
          id="email"
          label="E-mail"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          id="password"
          label="Senha"
          type="password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button type="submit" fullWidth disabled={loading} className="py-2.5">
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </>
  );
}
