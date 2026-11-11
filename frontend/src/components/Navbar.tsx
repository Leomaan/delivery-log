import { BarChart3, ClipboardList, Download, LogOut, Settings2, Utensils } from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';
import type { ActiveTab } from '../types/domain';
import { Button } from './ui/Button';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onLogout: () => Promise<void>;
}

const NAV_ITEMS: { id: ActiveTab; label: string; Icon: typeof ClipboardList }[] = [
  { id: 'deliveries', label: 'Lançamentos', Icon: ClipboardList },
  { id: 'reports', label: 'Relatório', Icon: BarChart3 },
  { id: 'places', label: 'Destinos', Icon: Settings2 },
];

export function Navbar({ activeTab, onTabChange, onLogout }: NavbarProps) {
  const { canInstall, promptInstall } = usePwaInstall();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-sm text-slate-900">Gestor de Entregas</span>
            <span className="hidden sm:inline-block ml-2 text-xs text-slate-400">
              Organizador de Fornecimento
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <Button
              key={id}
              variant="tab"
              size="sm"
              active={activeTab === id}
              onClick={() => onTabChange(id)}
              className="px-3 py-1.5 font-medium"
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          {canInstall && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void promptInstall()}
              title="Instalar aplicativo no dispositivo"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Instalar App</span>
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={() => void onLogout()} title="Sair">
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
