import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Scissors, ChevronDown, ChevronRight, Trash2, Edit2, Clock, Package, Printer } from 'lucide-react';
import { modelsApi, materialsApi } from '../services/api';
import { CoutureModel, Material } from '../types';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import PrintModal from '../components/print/PrintModal';
import FicheTechniqueModele from '../components/print/FicheTechniqueModele';

function ModelForm({ model, onSave, onClose }: { model?: CoutureModel; onSave: (data: unknown) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    code: model?.code || '',
    name: model?.name || '',
    category: model?.category || 'Chemise',
    description: model?.description || '',
    salePrice: model?.salePrice || ''
  });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Code *</label>
          <input className="input" value={form.code} onChange={e => set('code', e.target.value)} required placeholder="MOD-CHM-001" />
        </div>
        <div>
          <label className="label">Catégorie</label>
          <input className="input" value={form.category} onChange={e => set('category', e.target.value)} placeholder="Chemise, Robe, Pantalon..." />
        </div>
      </div>
      <div>
        <label className="label">Nom du modèle *</label>
        <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input" value={form.description} onChange={e => set('description', e.target.value)} rows={2} />
      </div>
      <div>
        <label className="label">Prix de vente (DZD)</label>
        <input type="number" min="0" step="0.01" className="input" value={form.salePrice} onChange={e => set('salePrice', e.target.value)} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button type="submit" className="btn-primary">{model ? 'Modifier' : 'Créer'}</button>
      </div>
    </form>
  );
}

function ComponentForm({ modelId, onSave, onClose }: { modelId: string; onSave: (data: unknown) => void; onClose: () => void }) {
  const { data: materials = [] } = useQuery({ queryKey: ['materials'], queryFn: () => materialsApi.getAll().then(r => r.data as Material[]) });
  const [form, setForm] = useState({ materialId: '', quantity: 0, notes: '' });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div>
        <label className="label">Matière *</label>
        <select className="input" value={form.materialId} onChange={e => set('materialId', e.target.value)} required>
          <option value="">— Sélectionner —</option>
          {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
        </select>
      </div>
      <div>
        <label className="label">Quantité nécessaire *</label>
        <input type="number" min="0.0001" step="0.0001" className="input" value={form.quantity} onChange={e => set('quantity', +e.target.value)} required />
      </div>
      <div>
        <label className="label">Notes</label>
        <input className="input" value={form.notes} onChange={e => set('notes', e.target.value)} />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button type="submit" className="btn-primary">Ajouter</button>
      </div>
    </form>
  );
}

function OperationForm({ modelId, onSave, onClose }: { modelId: string; onSave: (data: unknown) => void; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', machineType: '', standardMinutes: 0, sequence: 0, description: '' });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Opération *</label>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Assemblage col" />
        </div>
        <div>
          <label className="label">Machine</label>
          <input className="input" value={form.machineType} onChange={e => set('machineType', e.target.value)} placeholder="Machine plate, surjeteuse..." />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Temps standard (minutes) *</label>
          <input type="number" min="0.1" step="0.1" className="input" value={form.standardMinutes} onChange={e => set('standardMinutes', +e.target.value)} required />
        </div>
        <div>
          <label className="label">Séquence</label>
          <input type="number" min="0" className="input" value={form.sequence} onChange={e => set('sequence', +e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button type="submit" className="btn-primary">Ajouter</button>
      </div>
    </form>
  );
}

function ModelDetail({ model }: { model: CoutureModel }) {
  const qc = useQueryClient();
  const [showCompForm, setShowCompForm] = useState(false);
  const [showOpForm, setShowOpForm] = useState(false);

  const addComp = useMutation({
    mutationFn: (d: unknown) => modelsApi.addComponent(model.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['models'] }); setShowCompForm(false); }
  });
  const delComp = useMutation({
    mutationFn: (cid: string) => modelsApi.deleteComponent(model.id, cid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['models'] })
  });
  const addOp = useMutation({
    mutationFn: (d: unknown) => modelsApi.addOperation(model.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['models'] }); setShowOpForm(false); }
  });
  const delOp = useMutation({
    mutationFn: (oid: string) => modelsApi.deleteOperation(model.id, oid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['models'] })
  });

  const totalMinutes = model.operations.reduce((s, op) => s + Number(op.standardMinutes), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Composants */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Package className="w-4 h-4" /> Composants ({model.components.length})</h4>
            <button onClick={() => setShowCompForm(true)} className="text-primary-600 hover:text-primary-700 text-xs font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Ajouter</button>
          </div>
          <div className="space-y-2">
            {model.components.map(c => (
              <div key={c.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                <span className="font-medium text-gray-700">{c.material.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{Number(c.quantity)} {c.material.unit}</span>
                  <button onClick={() => delComp.mutate(c.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
            {model.components.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Aucun composant</p>}
          </div>
        </div>

        {/* Opérations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Clock className="w-4 h-4" /> Opérations — {totalMinutes} min</h4>
            <button onClick={() => setShowOpForm(true)} className="text-primary-600 hover:text-primary-700 text-xs font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Ajouter</button>
          </div>
          <div className="space-y-2">
            {model.operations.map(op => (
              <div key={op.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                <div>
                  <span className="font-medium text-gray-700">{op.sequence}. {op.name}</span>
                  {op.machineType && <span className="ml-2 text-xs text-gray-400">[{op.machineType}]</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary-600 font-semibold">{Number(op.standardMinutes)} min</span>
                  <button onClick={() => delOp.mutate(op.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
            {model.operations.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Aucune opération</p>}
          </div>
        </div>
      </div>

      <Modal isOpen={showCompForm} onClose={() => setShowCompForm(false)} title="Ajouter un composant">
        <ComponentForm modelId={model.id} onSave={d => addComp.mutate(d)} onClose={() => setShowCompForm(false)} />
      </Modal>
      <Modal isOpen={showOpForm} onClose={() => setShowOpForm(false)} title="Ajouter une opération">
        <OperationForm modelId={model.id} onSave={d => addOp.mutate(d)} onClose={() => setShowOpForm(false)} />
      </Modal>
    </div>
  );
}

export default function Models() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<CoutureModel | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [printModelId, setPrintModelId] = useState<string | null>(null);

  const { data: models = [], isLoading } = useQuery({
    queryKey: ['models', search],
    queryFn: () => modelsApi.getAll({ search: search || undefined }).then(r => r.data as CoutureModel[])
  });

  const createMut = useMutation({
    mutationFn: (d: unknown) => modelsApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['models'] }); setShowForm(false); }
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => modelsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['models'] }); setEditItem(null); }
  });

  return (
    <div className="space-y-5">
      <div className="flex gap-3 items-center justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Rechercher un modèle..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> Nouveau modèle</button>
      </div>

      <div className="space-y-3">
        {isLoading ? <div className="card p-8 text-center text-gray-400">Chargement...</div> :
          models.length === 0 ? (
            <div className="card p-12 text-center">
              <Scissors className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun modèle</p>
            </div>
          ) : models.map(m => (
            <div key={m.id} className="card overflow-hidden">
              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(expanded === m.id ? null : m.id)}
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-400">{m.code}</span>
                    <Badge variant="purple">{m.category}</Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900">{m.name}</h3>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-gray-700">{m.components.length}</p>
                    <p className="text-xs text-gray-400">composants</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-700">{m.operations.reduce((s, o) => s + Number(o.standardMinutes), 0)} min</p>
                    <p className="text-xs text-gray-400">temps std</p>
                  </div>
                  {m.salePrice && (
                    <div className="text-center">
                      <p className="font-semibold text-green-600">{Number(m.salePrice).toLocaleString('fr-DZ')} DZD</p>
                      <p className="text-xs text-gray-400">prix vente</p>
                    </div>
                  )}
                  <button onClick={e => { e.stopPropagation(); setPrintModelId(m.id); }} className="p-2 hover:bg-purple-50 rounded-lg text-purple-500" title="Fiche Technique">
                    <Printer className="w-4 h-4" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setEditItem(m); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {expanded === m.id ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </div>
              </div>
              {expanded === m.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                  <ModelDetail model={m} />
                </div>
              )}
            </div>
          ))
        }
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nouveau modèle">
        <ModelForm onSave={d => createMut.mutate(d)} onClose={() => setShowForm(false)} />
      </Modal>
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Modifier le modèle">
        {editItem && <ModelForm model={editItem} onSave={d => updateMut.mutate({ id: editItem.id, data: d })} onClose={() => setEditItem(null)} />}
      </Modal>
      <PrintModal isOpen={!!printModelId} onClose={() => setPrintModelId(null)} title="Fiche Technique Modèle">
        {printModelId && <FicheTechniqueModele modelId={printModelId} />}
      </PrintModal>
    </div>
  );
}
