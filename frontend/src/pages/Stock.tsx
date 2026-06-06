import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Warehouse, Package, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { stockApi, modelsApi } from '../services/api';
import { FinishedStock, CoutureModel } from '../types';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { format } from 'date-fns';

type StockSummary = { model: { id: string; name: string; code: string; category: string }; quantity: number; totalValue: number };

function StockMovementForm({ onSave, onClose }: { onSave: (d: unknown) => void; onClose: () => void }) {
  const { data: models = [] } = useQuery({ queryKey: ['models'], queryFn: () => modelsApi.getAll().then(r => r.data as CoutureModel[]) });
  const [form, setForm] = useState({
    modelId: '', type: 'ENTREE', quantity: 0, productionCost: '',
    reference: '', notes: '', date: format(new Date(), 'yyyy-MM-dd')
  });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, date: new Date(form.date), productionCost: form.productionCost || undefined }); }} className="space-y-4">
      <div>
        <label className="label">Modèle *</label>
        <select className="input" value={form.modelId} onChange={e => set('modelId', e.target.value)} required>
          <option value="">— Sélectionner —</option>
          {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="ENTREE">Entrée (production)</option>
            <option value="SORTIE">Sortie (vente)</option>
            <option value="AJUSTEMENT">Ajustement</option>
          </select>
        </div>
        <div>
          <label className="label">Quantité *</label>
          <input type="number" min="1" className="input" value={form.quantity} onChange={e => set('quantity', +e.target.value)} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Coût de production (DZD)</label>
          <input type="number" min="0" step="0.01" className="input" value={form.productionCost} onChange={e => set('productionCost', e.target.value)} placeholder="Coût unitaire calculé" />
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Référence</label>
        <input className="input" value={form.reference} onChange={e => set('reference', e.target.value)} placeholder="N° OF, Bon de livraison..." />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button type="submit" className="btn-primary">Enregistrer</button>
      </div>
    </form>
  );
}

export default function Stock() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<'summary' | 'movements'>('summary');

  const { data: summary = [], isLoading: sumLoading } = useQuery({
    queryKey: ['stock-summary'],
    queryFn: () => stockApi.getFinishedSummary().then(r => r.data as StockSummary[])
  });

  const { data: movements = [], isLoading: movLoading } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: () => stockApi.getFinished().then(r => r.data as FinishedStock[])
  });

  const addMov = useMutation({
    mutationFn: (d: unknown) => stockApi.addMovement(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock-summary', 'stock-movements'] }); setShowForm(false); }
  });

  const totalPieces = summary.reduce((s, i) => s + i.quantity, 0);
  const totalValue = summary.reduce((s, i) => s + i.totalValue, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-sm text-gray-500">Modèles en stock</p>
          <p className="text-3xl font-bold text-primary-600">{summary.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Total pièces finies</p>
          <p className="text-3xl font-bold text-green-600">{totalPieces.toLocaleString('fr-DZ')}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Valeur stock estimée</p>
          <p className="text-3xl font-bold text-blue-600">{totalValue.toLocaleString('fr-DZ', { minimumFractionDigits: 0 })} DZD</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          <button onClick={() => setTab('summary')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'summary' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
            Stock actuel
          </button>
          <button onClick={() => setTab('movements')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'movements' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
            Mouvements
          </button>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> Mouvement stock</button>
      </div>

      {tab === 'summary' && (
        <div className="card overflow-hidden">
          {sumLoading ? <div className="p-8 text-center text-gray-400">Chargement...</div> :
            summary.length === 0 ? (
              <div className="p-12 text-center"><Warehouse className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Stock vide</p></div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="table-header">Modèle</th>
                    <th className="table-header">Catégorie</th>
                    <th className="table-header text-center">Quantité</th>
                    <th className="table-header text-right">Valeur estimée</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {summary.map(s => (
                    <tr key={s.model.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <p className="font-semibold text-gray-900">{s.model.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{s.model.code}</p>
                      </td>
                      <td className="table-cell"><Badge variant="purple">{s.model.category}</Badge></td>
                      <td className="table-cell text-center">
                        <span className={`text-xl font-bold ${s.quantity < 10 ? 'text-orange-500' : 'text-green-600'}`}>{s.quantity}</span>
                        <span className="text-xs text-gray-400 ml-1">pcs</span>
                      </td>
                      <td className="table-cell text-right font-semibold">{s.totalValue.toLocaleString('fr-DZ', { minimumFractionDigits: 0 })} DZD</td>
                      <td className="table-cell">
                        <div className="flex gap-1">
                          <button onClick={() => setShowForm(true)} className="p-1.5 hover:bg-green-50 rounded text-green-500" title="Entrée"><ArrowUpCircle className="w-4 h-4" /></button>
                          <button onClick={() => setShowForm(true)} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Sortie"><ArrowDownCircle className="w-4 h-4" /></button>
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

      {tab === 'movements' && (
        <div className="card overflow-hidden">
          {movLoading ? <div className="p-8 text-center text-gray-400">Chargement...</div> :
            movements.length === 0 ? (
              <div className="p-12 text-center"><Package className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucun mouvement</p></div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="table-header">Modèle</th>
                    <th className="table-header">Type</th>
                    <th className="table-header text-center">Qté</th>
                    <th className="table-header text-right">Coût unit.</th>
                    <th className="table-header">Référence</th>
                    <th className="table-header">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {movements.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{m.model.name}</td>
                      <td className="table-cell">
                        <Badge variant={m.type === 'ENTREE' ? 'success' : m.type === 'SORTIE' ? 'danger' : 'warning'}>
                          {m.type === 'ENTREE' ? '+ Entrée' : m.type === 'SORTIE' ? '- Sortie' : 'Ajust.'}
                        </Badge>
                      </td>
                      <td className={`table-cell text-center font-bold ${m.type === 'SORTIE' ? 'text-red-600' : 'text-green-600'}`}>{m.type === 'SORTIE' ? '-' : '+'}{Number(m.quantity)}</td>
                      <td className="table-cell text-right">{m.productionCost ? `${Number(m.productionCost).toLocaleString('fr-DZ')} DZD` : '—'}</td>
                      <td className="table-cell text-gray-500">{m.reference || '—'}</td>
                      <td className="table-cell text-sm">{format(new Date(m.date), 'dd/MM/yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Mouvement Stock Produit Fini" size="lg">
        <StockMovementForm onSave={d => addMov.mutate(d)} onClose={() => setShowForm(false)} />
      </Modal>
    </div>
  );
}
