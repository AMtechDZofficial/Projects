import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Package, AlertTriangle, ArrowUpCircle, ArrowDownCircle, Edit2 } from 'lucide-react';
import { materialsApi, suppliersApi } from '../services/api';
import { Material, MaterialCategory } from '../types';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { format } from 'date-fns';

const CATEGORIES: MaterialCategory[] = ['TISSU', 'FIL', 'BOUTON', 'FERMETURE', 'DOUBLURE', 'ELASTIQUE', 'DENTELLE', 'BRODERIE', 'EMBALLAGE', 'AUTRE'];

function MaterialForm({ material, onSave, onClose }: { material?: Material; onSave: (data: Partial<Material>) => void; onClose: () => void }) {
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: () => suppliersApi.getAll().then(r => r.data) });
  const [form, setForm] = useState({
    code: material?.code || '',
    name: material?.name || '',
    category: material?.category || 'TISSU' as MaterialCategory,
    unit: material?.unit || 'mètre',
    unitCost: material?.unitCost || 0,
    stockQuantity: material?.stockQuantity || 0,
    minimumStock: material?.minimumStock || 0,
    supplierId: material?.supplierId || ''
  });

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Code *</label>
          <input className="input" value={form.code} onChange={e => set('code', e.target.value)} required placeholder="TIS-001" />
        </div>
        <div>
          <label className="label">Nom *</label>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Catégorie</label>
          <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Unité *</label>
          <input className="input" value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="mètre, kg, pièce..." required />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Coût unitaire (DZD)</label>
          <input type="number" min="0" step="0.01" className="input" value={form.unitCost} onChange={e => set('unitCost', +e.target.value)} />
        </div>
        <div>
          <label className="label">Stock actuel</label>
          <input type="number" min="0" step="0.001" className="input" value={form.stockQuantity} onChange={e => set('stockQuantity', +e.target.value)} />
        </div>
        <div>
          <label className="label">Stock minimum</label>
          <input type="number" min="0" step="0.001" className="input" value={form.minimumStock} onChange={e => set('minimumStock', +e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Fournisseur</label>
        <select className="input" value={form.supplierId} onChange={e => set('supplierId', e.target.value)}>
          <option value="">— Sélectionner —</option>
          {(suppliers as Array<{ id: string; name: string }>).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button type="submit" className="btn-primary">{material ? 'Modifier' : 'Créer'}</button>
      </div>
    </form>
  );
}

function MovementForm({ materialId, onSave, onClose }: { materialId: string; onSave: (data: unknown) => void; onClose: () => void }) {
  const [form, setForm] = useState({ type: 'ENTREE', quantity: 0, unitCost: 0, reference: '', notes: '', date: format(new Date(), 'yyyy-MM-dd') });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="ENTREE">Entrée</option>
            <option value="SORTIE">Sortie</option>
            <option value="AJUSTEMENT">Ajustement</option>
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Quantité *</label>
          <input type="number" min="0.001" step="0.001" className="input" value={form.quantity} onChange={e => set('quantity', +e.target.value)} required />
        </div>
        <div>
          <label className="label">Prix unitaire (DZD)</label>
          <input type="number" min="0" step="0.01" className="input" value={form.unitCost} onChange={e => set('unitCost', +e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Référence</label>
        <input className="input" value={form.reference} onChange={e => set('reference', e.target.value)} placeholder="N° BL, facture..." />
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button type="submit" className="btn-primary">Enregistrer</button>
      </div>
    </form>
  );
}

export default function Materials() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Material | null>(null);
  const [movementItem, setMovementItem] = useState<Material | null>(null);

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['materials', search, categoryFilter],
    queryFn: () => materialsApi.getAll({ search: search || undefined, category: categoryFilter || undefined }).then(r => r.data as Material[])
  });

  const createMut = useMutation({
    mutationFn: (data: unknown) => materialsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['materials'] }); setShowForm(false); }
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => materialsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['materials'] }); setEditItem(null); }
  });

  const movementMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => materialsApi.addMovement(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['materials'] }); setMovementItem(null); }
  });

  const getCategoryBadge = (cat: MaterialCategory): 'purple' | 'info' | 'success' | 'warning' | 'default' => {
    const map: Record<MaterialCategory, 'purple' | 'info' | 'success' | 'warning' | 'default'> = {
      TISSU: 'purple', FIL: 'info', BOUTON: 'info', FERMETURE: 'warning',
      DOUBLURE: 'success', ELASTIQUE: 'default', DENTELLE: 'purple',
      BRODERIE: 'info', EMBALLAGE: 'default', AUTRE: 'default'
    };
    return map[cat] || 'default';
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-40" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">Toutes</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Nouvelle matière
        </button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Chargement...</div>
        ) : materials.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucune matière première</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Code</th>
                <th className="table-header">Nom</th>
                <th className="table-header">Catégorie</th>
                <th className="table-header">Unité</th>
                <th className="table-header text-right">Prix unit.</th>
                <th className="table-header text-right">Stock</th>
                <th className="table-header text-right">Min.</th>
                <th className="table-header">Statut</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {materials.map(m => {
                const isLow = Number(m.stockQuantity) <= Number(m.minimumStock);
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="table-cell font-mono text-xs font-semibold text-gray-600">{m.code}</td>
                    <td className="table-cell font-medium text-gray-900">{m.name}</td>
                    <td className="table-cell"><Badge variant={getCategoryBadge(m.category)}>{m.category}</Badge></td>
                    <td className="table-cell text-gray-500">{m.unit}</td>
                    <td className="table-cell text-right">{Number(m.unitCost).toLocaleString('fr-DZ')} DZD</td>
                    <td className={`table-cell text-right font-semibold ${isLow ? 'text-red-600' : 'text-gray-700'}`}>
                      {Number(m.stockQuantity).toLocaleString('fr-DZ')}
                    </td>
                    <td className="table-cell text-right text-gray-400">{Number(m.minimumStock).toLocaleString('fr-DZ')}</td>
                    <td className="table-cell">
                      {isLow
                        ? <Badge variant="danger"><AlertTriangle className="w-3 h-3 mr-1 inline" />Faible</Badge>
                        : <Badge variant="success">OK</Badge>
                      }
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditItem(m)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setMovementItem(m)} className="p-1.5 hover:bg-green-50 rounded-lg text-green-600"><ArrowUpCircle className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { setMovementItem(m); }} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><ArrowDownCircle className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nouvelle matière première" size="lg">
        <MaterialForm onSave={data => createMut.mutate(data)} onClose={() => setShowForm(false)} />
      </Modal>

      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Modifier la matière" size="lg">
        {editItem && <MaterialForm material={editItem} onSave={data => updateMut.mutate({ id: editItem.id, data })} onClose={() => setEditItem(null)} />}
      </Modal>

      <Modal isOpen={!!movementItem} onClose={() => setMovementItem(null)} title={`Mouvement — ${movementItem?.name}`}>
        {movementItem && <MovementForm materialId={movementItem.id} onSave={data => movementMut.mutate({ id: movementItem.id, data })} onClose={() => setMovementItem(null)} />}
      </Modal>
    </div>
  );
}
