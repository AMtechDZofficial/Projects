import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Settings, Wrench, AlertCircle, CheckCircle, Power } from 'lucide-react';
import { machinesApi } from '../services/api';
import type { Machine, MachineType, MachineStatus } from '../types';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';

const machineTypeLabel: Record<MachineType, string> = {
  MACHINE_PLATE: 'Machine plate',
  SURJETEUSE: 'Surjeteuse',
  BOUTONNIERE: 'Boutonnière',
  MACHINE_BOUTON: 'Machine bouton',
  TABLE_COUPE: 'Table de coupe',
  FER_REPASSAGE: 'Fer à repasser',
  MACHINE_CANON: 'Machine canon',
  BRODERIE: 'Broderie',
  POINT_INVISIBLE: 'Point invisible',
  PRESSE: 'Presse',
  AUTRE: 'Autre'
};

const statusConfig: Record<MachineStatus, { label: string; badge: 'success' | 'info' | 'danger' | 'warning' }> = {
  DISPONIBLE: { label: 'Disponible', badge: 'success' },
  EN_SERVICE: { label: 'En service', badge: 'info' },
  EN_PANNE: { label: 'En panne', badge: 'danger' },
  MAINTENANCE: { label: 'Maintenance', badge: 'warning' }
};

function MachineForm({ machine, onSave, onClose }: { machine?: Machine; onSave: (d: unknown) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    code: machine?.code || '',
    name: machine?.name || '',
    type: machine?.type || 'MACHINE_PLATE' as MachineType,
    brand: machine?.brand || '',
    model: machine?.model || '',
    status: machine?.status || 'DISPONIBLE' as MachineStatus,
    location: machine?.location || '',
    notes: machine?.notes || ''
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Code *</label>
          <input className="input" value={form.code} onChange={e => set('code', e.target.value)} required placeholder="MC-001" />
        </div>
        <div>
          <label className="label">Type *</label>
          <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
            {(Object.keys(machineTypeLabel) as MachineType[]).map(t => (
              <option key={t} value={t}>{machineTypeLabel[t]}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Nom *</label>
        <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Marque</label>
          <input className="input" value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Juki, Brother, Singer..." />
        </div>
        <div>
          <label className="label">Modèle</label>
          <input className="input" value={form.model} onChange={e => set('model', e.target.value)} placeholder="DDL-8700..." />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Statut</label>
          <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
            {(Object.keys(statusConfig) as MachineStatus[]).map(s => (
              <option key={s} value={s}>{statusConfig[s].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Emplacement</label>
          <input className="input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="Zone A, Poste 3..." />
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button type="submit" className="btn-primary">{machine ? 'Modifier' : 'Créer'}</button>
      </div>
    </form>
  );
}

export default function Machines() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Machine | null>(null);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['machine-stats'],
    queryFn: () => machinesApi.getStats().then(r => r.data as { total: number; disponible: number; enService: number; enPanne: number; maintenance: number })
  });

  const { data: machines = [], isLoading } = useQuery({
    queryKey: ['machines', filterType, filterStatus],
    queryFn: () => machinesApi.getAll({
      type: filterType || undefined,
      status: filterStatus || undefined
    }).then(r => r.data as Machine[])
  });

  const createMut = useMutation({
    mutationFn: (d: unknown) => machinesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['machines'] }); qc.invalidateQueries({ queryKey: ['machine-stats'] }); setShowForm(false); }
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => machinesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['machines'] }); qc.invalidateQueries({ queryKey: ['machine-stats'] }); setEditItem(null); }
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => machinesApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['machines'] }); qc.invalidateQueries({ queryKey: ['machine-stats'] }); }
  });

  const statCards = [
    { label: 'Total', value: stats?.total || 0, color: 'text-gray-700', icon: Settings },
    { label: 'Disponibles', value: stats?.disponible || 0, color: 'text-green-600', icon: CheckCircle },
    { label: 'En service', value: stats?.enService || 0, color: 'text-blue-600', icon: Power },
    { label: 'En panne', value: stats?.enPanne || 0, color: 'text-red-600', icon: AlertCircle },
    { label: 'Maintenance', value: stats?.maintenance || 0, color: 'text-yellow-600', icon: Wrench }
  ];

  const nextStatus: Record<MachineStatus, MachineStatus> = {
    DISPONIBLE: 'EN_SERVICE',
    EN_SERVICE: 'DISPONIBLE',
    EN_PANNE: 'MAINTENANCE',
    MAINTENANCE: 'DISPONIBLE'
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-5 gap-3">
        {statCards.map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <p className="text-xs text-gray-500">{label}</p>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 items-center justify-between">
        <div className="flex gap-2">
          <select className="input max-w-[180px]" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Tous types</option>
            {(Object.keys(machineTypeLabel) as MachineType[]).map(t => (
              <option key={t} value={t}>{machineTypeLabel[t]}</option>
            ))}
          </select>
          <select className="input max-w-[160px]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Tous statuts</option>
            {(Object.keys(statusConfig) as MachineStatus[]).map(s => (
              <option key={s} value={s}>{statusConfig[s].label}</option>
            ))}
          </select>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> Nouvelle machine</button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-gray-400">Chargement...</div> :
          machines.length === 0 ? (
            <div className="p-12 text-center">
              <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune machine</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-header">Code</th>
                  <th className="table-header">Machine</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Marque / Modèle</th>
                  <th className="table-header">Emplacement</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {machines.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="table-cell font-mono text-sm text-gray-500">{m.code}</td>
                    <td className="table-cell font-semibold text-gray-900">{m.name}</td>
                    <td className="table-cell"><Badge variant="purple">{machineTypeLabel[m.type]}</Badge></td>
                    <td className="table-cell text-sm text-gray-500">{m.brand}{m.brand && m.model ? ' ' : ''}{m.model || ''}</td>
                    <td className="table-cell text-sm">{m.location || '—'}</td>
                    <td className="table-cell"><Badge variant={statusConfig[m.status].badge}>{statusConfig[m.status].label}</Badge></td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button
                          onClick={() => statusMut.mutate({ id: m.id, status: nextStatus[m.status] })}
                          className={`p-1.5 rounded text-xs font-medium ${m.status === 'EN_PANNE' ? 'hover:bg-yellow-50 text-yellow-600' : m.status === 'DISPONIBLE' ? 'hover:bg-blue-50 text-blue-500' : 'hover:bg-green-50 text-green-500'}`}
                          title={`→ ${statusConfig[nextStatus[m.status]].label}`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditItem(m)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500" title="Modifier">
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nouvelle machine">
        <MachineForm onSave={d => createMut.mutate(d)} onClose={() => setShowForm(false)} />
      </Modal>
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Modifier la machine">
        {editItem && <MachineForm machine={editItem} onSave={d => updateMut.mutate({ id: editItem.id, data: d })} onClose={() => setEditItem(null)} />}
      </Modal>
    </div>
  );
}
