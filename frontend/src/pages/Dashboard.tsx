import { useQuery } from '@tanstack/react-query';
import { Package, Scissors, Factory, Warehouse, Users, CreditCard, AlertTriangle, TrendingUp } from 'lucide-react';
import StatsCard from '../components/ui/StatsCard';
import { dashboardApi } from '../services/api';
import { DashboardStats } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get().then(r => r.data as { stats: DashboardStats; recentMovements: unknown[] })
  });

  const stats = data?.stats;
  const currency = 'DZD';

  if (isLoading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="card p-6 h-32 animate-pulse bg-gray-100" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Vue d'ensemble</h2>
        <p className="text-gray-500 text-sm">{format(new Date(), 'EEEE dd MMMM yyyy', { locale: fr })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Matières en stock" value={stats?.totalMaterials || 0} icon={Package} color="blue" subtitle="Articles actifs" />
        <StatsCard title="Stock faible" value={stats?.lowStockCount || 0} icon={AlertTriangle} color={stats?.lowStockCount ? 'red' : 'green'} subtitle="En dessous du minimum" />
        <StatsCard title="Modèles actifs" value={stats?.activeModels || 0} icon={Scissors} color="purple" />
        <StatsCard title="Ordres en cours" value={stats?.pendingOrders || 0} icon={Factory} color="orange" />
        <StatsCard title="Stock fini (pièces)" value={stats?.finishedStockCount?.toFixed(0) || 0} icon={Warehouse} color="green" />
        <StatsCard title="Employés actifs" value={stats?.activeEmployees || 0} icon={Users} color="blue" />
        <StatsCard title="Paies en attente" value={stats?.unpaidPayrolls || 0} icon={CreditCard} color="orange" />
        <StatsCard
          title="Coût minute"
          value={stats?.coutMinute ? `${Number(stats.coutMinute).toFixed(2)} ${currency}` : '—'}
          icon={TrendingUp}
          color="purple"
          subtitle="Par opérateur/minute"
        />
      </div>

      {stats?.lowStockCount && stats.lowStockCount > 0 ? (
        <div className="card p-4 border-l-4 border-red-400 bg-red-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-sm font-medium text-red-700">
              {stats.lowStockCount} matière(s) en dessous du stock minimum — réapprovisionnement nécessaire
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Derniers mouvements de stock</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {((data?.recentMovements as Array<{ id: string; type: string; quantity: number; material: { name: string }; date: string }>) || []).map(m => (
              <div key={m.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">{m.material?.name}</p>
                  <p className="text-xs text-gray-400">{format(new Date(m.date), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <span className={`text-sm font-semibold ${m.type === 'ENTREE' ? 'text-green-600' : 'text-red-600'}`}>
                  {m.type === 'ENTREE' ? '+' : '-'}{m.quantity}
                </span>
              </div>
            ))}
            {(!data?.recentMovements || (data.recentMovements as unknown[]).length === 0) && (
              <p className="px-5 py-8 text-center text-gray-400 text-sm">Aucun mouvement récent</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Formule Coût Minute</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="bg-primary-50 rounded-xl p-4">
              <p className="text-xs text-primary-600 font-medium mb-2">FORMULE</p>
              <p className="text-sm font-mono text-primary-800">
                Coût Min = Σ Salaires / (Opérateurs × Jours × H/J × 60 × Efficacité)
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs text-gray-500 font-medium mb-2">COÛT MODÈLE</p>
              <p className="text-sm font-mono text-gray-700">
                Coût Matières + (Σ Minutes Op. × Coût Min) + Overhead%
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-xs text-green-600 font-medium mb-2">PAIE PIÈCE</p>
              <p className="text-sm font-mono text-green-800">
                Σ (Quantité × Tarif Pièce par Opération)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
