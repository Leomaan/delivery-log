import { useState } from 'react';
import { DeliveriesView } from '../components/DeliveriesView';
import { Navbar } from '../components/Navbar';
import { PlacesAndPricesView } from '../components/PlacesAndPricesView';
import { ReportsView } from '../components/ReportsView';
import { usePlacesList } from '../hooks/usePlaces';
import type { ActiveTab } from '../types/domain';

interface DashboardPageProps {
  onLogout: () => Promise<void>;
}

export function DashboardPage({ onLogout }: DashboardPageProps) {
  const { places, reloadPlaces } = usePlacesList(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('deliveries');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} onLogout={onLogout} />

      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'deliveries' && <DeliveriesView places={places} />}
        {activeTab === 'reports' && <ReportsView places={places} />}
        {activeTab === 'places' && (
          <PlacesAndPricesView places={places} onPlacesChanged={reloadPlaces} />
        )}
      </main>
    </div>
  );
}
