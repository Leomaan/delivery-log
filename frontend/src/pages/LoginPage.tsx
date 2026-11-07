import { Utensils } from 'lucide-react';
import { LoginForm } from '../components/forms/LoginForm';
import type { AuthUser } from '../types/domain';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<AuthUser>;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-11 h-11 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-3">
            <Utensils className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Gestor de Entregas</h1>
          <p className="text-sm text-slate-500 mt-1">Organizador de Entregas e Conferência</p>
        </div>

        <LoginForm onLogin={onLogin} />
      </div>
    </div>
  );
}
