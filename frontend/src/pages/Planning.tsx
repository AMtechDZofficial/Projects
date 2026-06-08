import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, AlertTriangle, CheckCircle, BarChart2 } from 'lucide-react';
import { planningApi } from '../services/api';
import type { OrderCapacityItem } from '../types';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { format } from 'date-fns';

function CapacityBar({ load }: { load: number }) {
  const pct = Math.min(load, 100);
  const color = load >= 100 ? 'bg-red-500' : load >= 80 ? 'bg-orange-400' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold w-10 text-right ${load >= 100 ? 'text-red-600' : load >= 80 ? 'text-orange-500' : 'text-green-600'}`}>
        {load.toFixed(0)}%
      </span>
    </div>
  );
}

function ScheduleModal({ order, onSave, onClose }: { order: OrderCapacityItem; onSave: (d: unknown) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    plannedStart: order.plannedStart ? format(new Date(order.plannedStart), 'yyyy-MM-dd') : '',
    plannedEnd: order.plannedEnd ? format(new Date(order.plannedEnd), 'yyyy-MM-dd') : '',
    priority: 1
  });
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="p-3 bg-gray-50 rounded-xl text-sm">
        <p className="font-medium">{order.orderNumber}</p>
        <p className="text-gray-500">{order.modelName} — {order.quantity} pcs</p>
        <p className="text-xs text-primary-600 mt-1">Durée estimée: <strong>{Number(order.estimatedDays).toFixed(1)} jours</strong></p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Début planifié *</label>
          <input type="date" className="input" value={form.plannedStart} onChange={e => setForm(f => ({ ...f, plannedStart: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Fin planifiée</label>
          <input type="date" className="input" value={form.plannedEnd} onChange={e => setForm(f => ({ ...f, plannedEnd: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="label">Priorité (1 = haute)</label>
        <input type="number" min="1" max="10" className="input max-w-[100px]" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: +e.target.value }))} />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button type="submit" className="btn-primary"><Calendar className="w-4 h-4" /> Planifier</button>
      </div>
    </form>
  );
}

export default function Planning() {
  const qc = useQueryClient();
  const [scheduleOrder, setScheduleOrder] = useState<OrderCapacityItem | null>(null);

  const { data: capacity = [], isLoading } = useQuery({
    queryKey: ['planning-capacity'],
    queryFn: () => planningApi.getCapacity().then(r => (r.data as { orders: OrderCapacityItem[] }).orders)
  });

  const scheduleMut = useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: unknown }) => planningApi.schedule(orderId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['planning-capacity'] }); setScheduleOrder(null); }
  });

  const totalOrders = capacity.length;
  const scheduled = capacity.filter(o => o.plannedStart).length;
  const overload = capacity.filter(o => (o.estimatedDays || 0) > 20).length;
  const avgLoad = capacity.length
    ? capacity.reduce((s, o) => s + Math.min((o.estimatedDays || 0) / 20 * 100, 100), 0) / capacity.length
    : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Ordres actifs', value: totalOrders, color: 'text-gray-700' },
          { label: 'Planifiés', value: scheduled, color: 'text-blue-600' },
          { label: 'En surcharge', value: overload, color: 'text-red-600' },
          { label: 'Charge moy. atelier', value: `${avgLoad.toFixed(0)}%`, color: avgLoad >= 80 ? 'text-red-600' : 'text-green-600' }
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary-600" />
          <h3 className="font-semibold text-gray-800">Capacité & Planification des commandes</h3>
        </div>
        {isLoading ? <div className="p-8 text-center text-gray-400">Chargement...</div> :
          capacity.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune commande en cours de production</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-header">Commande</th>
                  <th className="table-header">Client</th>
                  <th className="table-header">Modèle</th>
                  <th className="table-header text-right">Qté</th>
                  <th className="table-header text-right">Durée est.</th>
                  <th className="table-header w-40">Charge</th>
                  <th className="table-header">Planifié</th>
                  <th className="table-header">Livraison</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {capacity.map(o => {
                  const load = (o.estimatedDays || 0) / 20 * 100;
                  const hasSchedule = !!o.plannedStart;
                  const isLate = o.deliveryDate && o.plannedEnd && new Date(o.plannedEnd) > new Date(o.deliveryDate);
                  return (
                    <tr key={o.id} className={`hover:bg-gray-50 ${isLate ? 'bg-orange-50' : ''}`}>
                      <td className="table-cell font-mono font-semibold text-gray-600">{o.orderNumber}</td>
                      <td className="table-cell text-sm">{o.clientName || '—'}</td>
                      <td className="table-cell text-sm">{o.modelName}</td>
                      <td className="table-cell text-right">{o.quantity}</td>
                      <td className="table-cell text-right">
                        <span className="flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {Number(o.estimatedDays).toFixed(1)}j
                        </span>
                      </td>
                      <td className="table-cell"><CapacityBar load={load} /></td>
                      <td className="table-cell text-sm">
                        {hasSchedule ? (
                          <div className="flex items-center gap-1 text-blue-600">
                            <CheckCircle className="w-3 h-3" />
                            {format(new Date(o.plannedStart!), 'dd/MM')} → {o.plannedEnd ? format(new Date(o.plannedEnd), 'dd/MM') : '?'}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Non planifié</span>
                        )}
                      </td>
                      <td className="table-cell text-sm">
                        {o.deliveryDate ? (
                          <div className={`flex items-center gap-1 ${isLate ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                            {isLate && <AlertTriangle className="w-3 h-3" />}
                            {format(new Date(o.deliveryDate), 'dd/MM/yyyy')}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={() => setScheduleOrder(o)}
                          className="p-1.5 hover:bg-blue-50 rounded text-blue-500"
                          title="Planifier"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        }
      </div>

      <Modal isOpen={!!scheduleOrder} onClose={() => setScheduleOrder(null)} title="Planifier la production">
        {scheduleOrder && (
          <ScheduleModal
            order={scheduleOrder}
            onSave={d => scheduleMut.mutate({ orderId: scheduleOrder.id, data: d })}
            onClose={() => setScheduleOrder(null)}
          />
        )}
      </Modal>
    </div>
  );
}
