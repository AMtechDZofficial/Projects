import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Factory, Play, Check, X, Clock } from 'lucide-react';
import { productionApi, modelsApi } from '../services/api';
import { ProductionOrder, CoutureModel, SemiFinishedStock } from '../types';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { format } from 'date-fns';

const statusMap = {
  EN_ATTENTE: { label: 'En attente', badge: 'warning' as const },
  EN_COURS: { label: 'En cours', badge: 'info' as const },
  TERMINE: { label: 'Terminé', badge: 'success' as const },
  ANNULE: { label: 'Annulé', badge: 'danger' as const }
};

function OrderForm({ onSave, onClose }: { onSave: (d: unknown) => void; onClose: () => void }) {
  const { data: models = [] } = useQuery({ queryKey: ['models'], queryFn: () => modelsApi.getAll().then(r => r.data as CoutureModel[]) });
  const [form, setForm] = useState({ modelId: '', quantity: 0, notes: '', startDate: '' });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div>
        <label className="label">Modèle *</label>
        <select className="input" value={form.modelId} onChange={e => set('modelId', e.target.value)} required>
          <option value="">— Sélectionner —</option>
          {models.map(m => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Quantité *</label>
          <input type="number" min="1" className="input" value={form.quantity} onChange={e => set('quantity', +e.target.value)} required />
        </div>
        <div>
          <label className="label">Date de début prévue</label>
          <input type="date" className="input" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button type="submit" className="btn-primary">Créer l'ordre</button>
      </div>
    </form>
  );
}

function SemiFinishedForm({ onSave, onClose }: { onSave: (d: unknown) => void; onClose: () => void }) {
  const { data: models = [] } = useQuery({ queryKey: ['models'], queryFn: () => modelsApi.getAll().then(r => r.data as CoutureModel[]) });
  const [selectedModel, setSelectedModel] = useState('');
  const [form, setForm] = useState({ modelId: '', operationId: '', quantity: 0, date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const ops = models.find(m => m.id === selectedModel)?.operations || [];

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, date: new Date(form.date) }); }} className="space-y-4">
      <div>
        <label className="label">Modèle *</label>
        <select className="input" value={selectedModel} onChange={e => { setSelectedModel(e.target.value); set('modelId', e.target.value); }} required>
          <option value="">— Sélectionner —</option>
          {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Opération (poste) *</label>
        <select className="input" value={form.operationId} onChange={e => set('operationId', e.target.value)} required>
          <option value="">— Sélectionner —</option>
          {ops.map(op => <option key={op.id} value={op.id}>{op.sequence}. {op.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Quantité *</label>
          <input type="number" min="1" className="input" value={form.quantity} onChange={e => set('quantity', +e.target.value)} required />
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button type="submit" className="btn-primary">Enregistrer</button>
      </div>
    </form>
  );
}

export default function Production() {
  const qc = useQueryClient();
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showSemiForm, setShowSemiForm] = useState(false);
  const [tab, setTab] = useState<'orders' | 'wip'>('orders');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => productionApi.getOrders().then(r => r.data as ProductionOrder[])
  });

  const { data: semiFinished = [] } = useQuery({
    queryKey: ['semi-finished'],
    queryFn: () => productionApi.getSemiFinished().then(r => r.data as SemiFinishedStock[])
  });

  const createOrder = useMutation({ mutationFn: (d: unknown) => productionApi.createOrder(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); setShowOrderForm(false); } });
  const updateStatus = useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => productionApi.updateStatus(id, status), onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }) });
  const addSemi = useMutation({ mutationFn: (d: unknown) => productionApi.addSemiFinished(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['semi-finished'] }); setShowSemiForm(false); } });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          <button onClick={() => setTab('orders')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'orders' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            Ordres de Fabrication
          </button>
          <button onClick={() => setTab('wip')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'wip' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            Encours (Semi-Finis)
          </button>
        </div>
        <div className="flex gap-2">
          {tab === 'orders' && <button onClick={() => setShowOrderForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> Nouvel ordre</button>}
          {tab === 'wip' && <button onClick={() => setShowSemiForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> Saisir encours</button>}
        </div>
      </div>

      {tab === 'orders' && (
        <div className="card overflow-hidden">
          {isLoading ? <div className="p-8 text-center text-gray-400">Chargement...</div> :
            orders.length === 0 ? (
              <div className="p-12 text-center"><Factory className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucun ordre de fabrication</p></div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="table-header">N° Ordre</th>
                    <th className="table-header">Modèle</th>
                    <th className="table-header text-center">Qté</th>
                    <th className="table-header">Statut</th>
                    <th className="table-header">Début</th>
                    <th className="table-header">Fin</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="table-cell font-mono font-semibold text-gray-600">{o.orderNumber}</td>
                      <td className="table-cell">
                        <p className="font-medium">{o.model.name}</p>
                        <p className="text-xs text-gray-400">{o.model.code}</p>
                      </td>
                      <td className="table-cell text-center font-bold text-lg">{o.quantity}</td>
                      <td className="table-cell"><Badge variant={statusMap[o.status].badge}>{statusMap[o.status].label}</Badge></td>
                      <td className="table-cell text-sm">{o.startDate ? format(new Date(o.startDate), 'dd/MM/yyyy') : '—'}</td>
                      <td className="table-cell text-sm">{o.endDate ? format(new Date(o.endDate), 'dd/MM/yyyy') : '—'}</td>
                      <td className="table-cell">
                        <div className="flex gap-1">
                          {o.status === 'EN_ATTENTE' && (
                            <button onClick={() => updateStatus.mutate({ id: o.id, status: 'EN_COURS' })} className="p-1.5 hover:bg-blue-50 rounded text-blue-500" title="Démarrer"><Play className="w-3.5 h-3.5" /></button>
                          )}
                          {o.status === 'EN_COURS' && (
                            <button onClick={() => updateStatus.mutate({ id: o.id, status: 'TERMINE' })} className="p-1.5 hover:bg-green-50 rounded text-green-500" title="Terminer"><Check className="w-3.5 h-3.5" /></button>
                          )}
                          {(o.status === 'EN_ATTENTE' || o.status === 'EN_COURS') && (
                            <button onClick={() => updateStatus.mutate({ id: o.id, status: 'ANNULE' })} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Annuler"><X className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      )}

      {tab === 'wip' && (
        <div className="card overflow-hidden">
          {semiFinished.length === 0 ? (
            <div className="p-12 text-center"><Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucun encours enregistré</p></div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-header">Modèle</th>
                  <th className="table-header">Opération (Poste)</th>
                  <th className="table-header text-center">Quantité</th>
                  <th className="table-header">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {semiFinished.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <p className="font-medium">{s.model.name}</p>
                      <p className="text-xs text-gray-400">{s.model.code}</p>
                    </td>
                    <td className="table-cell">
                      <Badge variant="purple">Poste {s.operation.sequence}</Badge>
                      <span className="ml-2 text-sm">{s.operation.name}</span>
                    </td>
                    <td className="table-cell text-center font-bold text-lg">{Number(s.quantity)}</td>
                    <td className="table-cell text-sm">{format(new Date(s.date), 'dd/MM/yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal isOpen={showOrderForm} onClose={() => setShowOrderForm(false)} title="Nouvel ordre de fabrication" size="lg">
        <OrderForm onSave={d => createOrder.mutate(d)} onClose={() => setShowOrderForm(false)} />
      </Modal>
      <Modal isOpen={showSemiForm} onClose={() => setShowSemiForm(false)} title="Saisir encours de production" size="lg">
        <SemiFinishedForm onSave={d => addSemi.mutate(d)} onClose={() => setShowSemiForm(false)} />
      </Modal>
    </div>
  );
}
