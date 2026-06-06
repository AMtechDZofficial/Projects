import { useQuery } from '@tanstack/react-query';
import { costsApi } from '../services/api';
import { CoutMinuteResult, ModelCostResult } from '../types';
import { Calculator, TrendingUp, Package, Clock, DollarSign, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

function CoutMinuteCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['cout-minute'],
    queryFn: () => costsApi.getCoutMinute().then(r => r.data as CoutMinuteResult)
  });

  if (isLoading) return <div className="card p-6 animate-pulse h-48" />;

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
          <Clock className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">Coût Minute</h3>
          <p className="text-xs text-gray-500">Base de calcul de la main d'œuvre</p>
        </div>
      </div>
      <div className="text-4xl font-bold text-primary-600 mb-4">
        {Number(data?.coutMinute || 0).toFixed(4)} <span className="text-lg font-normal text-gray-400">DZD/min</span>
      </div>
      <div className="bg-primary-50 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Total salaires mensuels</span>
          <span className="font-semibold">{Number(data?.totalSalaires || 0).toLocaleString('fr-DZ')} DZD</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Nombre d'opérateurs</span>
          <span className="font-semibold">{data?.numberOfOperators}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Jours ouvrés/mois</span>
          <span className="font-semibold">{data?.workDaysPerMonth} jours</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Heures/jour</span>
          <span className="font-semibold">{data?.hoursPerDay}h</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Efficacité cible</span>
          <span className="font-semibold">{data?.efficiency}%</span>
        </div>
        <div className="border-t border-primary-200 pt-2 flex justify-between font-semibold">
          <span className="text-primary-700">Minutes disponibles</span>
          <span className="text-primary-700">{Number(data?.totalMinutes || 0).toLocaleString('fr-DZ')} min</span>
        </div>
      </div>
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs font-mono text-gray-600 text-center">
          {data?.totalSalaires?.toLocaleString('fr-DZ')} ÷ {Number(data?.totalMinutes || 0).toLocaleString('fr-DZ')} = <strong>{Number(data?.coutMinute || 0).toFixed(4)} DZD/min</strong>
        </p>
      </div>
    </div>
  );
}

function ModelCostDetail({ modelId }: { modelId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['model-cost', modelId],
    queryFn: () => costsApi.getModelCost(modelId).then(r => r.data as ModelCostResult)
  });

  if (isLoading) return <div className="p-4 text-center text-gray-400 text-sm">Calcul en cours...</div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Matières', value: data.materialsCost, color: 'bg-blue-50 text-blue-700', icon: Package },
          { label: 'Main d\'oeuvre', value: data.laborCost, color: 'bg-green-50 text-green-700', icon: Clock },
          { label: 'Overhead', value: data.overheadCost, color: 'bg-orange-50 text-orange-700', icon: TrendingUp },
          { label: 'TOTAL', value: data.totalCost, color: 'bg-primary-50 text-primary-700', icon: DollarSign }
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className={`${color} rounded-xl p-4 text-center`}>
            <p className="text-xs font-medium mb-1">{label}</p>
            <p className="text-xl font-bold">{Number(value).toFixed(2)}</p>
            <p className="text-xs opacity-70">DZD</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h5 className="text-xs font-semibold text-gray-600 mb-2">Détail Matières</h5>
          <div className="space-y-1">
            {data.breakdown.materials.map((m, i) => (
              <div key={i} className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                <span>{m.name} × {m.quantity}</span>
                <span className="font-semibold">{Number(m.total).toFixed(2)} DZD</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h5 className="text-xs font-semibold text-gray-600 mb-2">Détail Opérations ({data.totalMinutes} min)</h5>
          <div className="space-y-1">
            {data.breakdown.operations.map((op, i) => (
              <div key={i} className="flex justify-between text-xs p-2 bg-gray-50 rounded">
                <span>{op.name} ({op.minutes} min)</span>
                <span className="font-semibold">{Number(op.total).toFixed(2)} DZD</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Costs() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const { data: modelsCosts = [], isLoading } = useQuery({
    queryKey: ['all-models-costs'],
    queryFn: () => costsApi.getAllModelsCosts().then(r => r.data as Array<{
      id: string; code: string; name: string; category: string;
      totalCost: number; materialsCost: number; laborCost: number;
      overheadCost: number; totalMinutes: number;
      salePrice?: number; margin?: number; marginPercent?: number;
    }>)
  });

  const chartData = modelsCosts.map(m => ({
    name: m.code,
    Matières: Number(m.materialsCost).toFixed(2),
    'Main d\'œuvre': Number(m.laborCost).toFixed(2),
    Overhead: Number(m.overheadCost).toFixed(2)
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CoutMinuteCard />

        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Coûts par Modèle</h3>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v} DZD`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Matières" stackId="a" fill="#60a5fa" />
                <Bar dataKey="Main d'œuvre" stackId="a" fill="#34d399" />
                <Bar dataKey="Overhead" stackId="a" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-gray-400 py-12">Aucun modèle avec données</p>}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Calculator className="w-4 h-4" /> Analyse des coûts par modèle</h3>
        </div>
        {isLoading ? <div className="p-8 text-center text-gray-400">Calcul des coûts...</div> : (
          <div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Modèle</th>
                  <th className="table-header text-right">Matières</th>
                  <th className="table-header text-right">MO</th>
                  <th className="table-header text-right">Overhead</th>
                  <th className="table-header text-right font-bold">Coût Total</th>
                  <th className="table-header text-right">Prix Vente</th>
                  <th className="table-header text-right">Marge</th>
                  <th className="table-header text-center">Minutes</th>
                  <th className="table-header"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {modelsCosts.map(m => (
                  <>
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div>
                          <p className="font-semibold text-gray-800">{m.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{m.code}</p>
                        </div>
                      </td>
                      <td className="table-cell text-right text-blue-600">{Number(m.materialsCost).toFixed(2)}</td>
                      <td className="table-cell text-right text-green-600">{Number(m.laborCost).toFixed(2)}</td>
                      <td className="table-cell text-right text-orange-500">{Number(m.overheadCost).toFixed(2)}</td>
                      <td className="table-cell text-right font-bold text-gray-900">{Number(m.totalCost).toFixed(2)} DZD</td>
                      <td className="table-cell text-right">{m.salePrice ? `${Number(m.salePrice).toFixed(2)} DZD` : '—'}</td>
                      <td className={`table-cell text-right font-semibold ${Number(m.margin || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {m.margin != null ? `${Number(m.margin).toFixed(2)} DZD` : '—'}
                        {m.marginPercent != null && <span className="block text-xs">({Number(m.marginPercent).toFixed(1)}%)</span>}
                      </td>
                      <td className="table-cell text-center text-primary-600 font-semibold">{Number(m.totalMinutes).toFixed(0)} min</td>
                      <td className="table-cell">
                        <button
                          onClick={() => setSelectedModel(selectedModel === m.id ? null : m.id)}
                          className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                        >
                          {selectedModel === m.id ? 'Réduire' : 'Détail'}
                        </button>
                      </td>
                    </tr>
                    {selectedModel === m.id && (
                      <tr key={`detail-${m.id}`}>
                        <td colSpan={9} className="px-4 py-4 bg-gray-50">
                          <ModelCostDetail modelId={m.id} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
            {modelsCosts.length === 0 && <p className="p-8 text-center text-gray-400">Aucun modèle</p>}
          </div>
        )}
      </div>
    </div>
  );
}
