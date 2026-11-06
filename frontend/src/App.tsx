import { useCallback, useEffect, useState } from 'react';
import { BarChart3, ClipboardList, LogOut, Settings2, Utensils } from 'lucide-react';
import { DeliveriesView } from './components/DeliveriesView';
import { LoginView } from './components/LoginView';
import { PlacesAndPricesView } from './components/PlacesAndPricesView';
import { ReportsView } from './components/ReportsView';
import { api, type AuthUser, type Place } from './lib/api';

type ActiveTab = 'deliveries' | 'reports' | 'places';

export function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('deliveries');
  const [places, setPlaces] = useState<Place[]>([]);

  const loadPlaces = useCallback(async () => {
    const res = await api.listPlaces();
    setPlaces(res.items);
  }, []);

  useEffect(() => {
    async function bootstrap() {
      const refreshed = await api.tryRefresh();
      if (refreshed) {
        setUser(refreshed.user);
      }
      setInitializing(false);
    }
    void bootstrap();
  }, []);

  useEffect(() => {
    if (user) {
      void loadPlaces();
    }
  }, [user, loadPlaces]);

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-500">
        Carregando...
      </div>
    );
  }

  if (!user) {
    return <LoginView onLoginSuccess={(loggedUser) => setUser(loggedUser)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header Branco com Detalhes em Azul */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-sm text-slate-900">Ponto 10</span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-400">
                Organizador de Quentinhas
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('deliveries')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'deliveries'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Lançamentos</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Relatório</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('places')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'places'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Tipos e Preços</span>
            </button>
          </nav>

          <button
            type="button"
            onClick={() => void handleLogout()}
            title="Sair"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'deliveries' && <DeliveriesView places={places} />}
        {activeTab === 'reports' && <ReportsView places={places} />}
        {activeTab === 'places' && (
          <PlacesAndPricesView places={places} onPlacesChanged={loadPlaces} />
        )}
      </main>
    </div>
  );
}
