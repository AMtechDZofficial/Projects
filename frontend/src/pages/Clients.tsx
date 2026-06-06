import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2, Search, Edit2, Phone, Mail, MapPin } from 'lucide-react';
import { clientsApi } from '../services/api';
import type { Client } from '../types';
import Modal from '../components/ui/Modal';

function ClientForm({ client, onSave, onClose }: { client?: Client; onSave: (d: unknown) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    code: client?.code || '',
    name: client?.name || '',
    contact: client?.contact || '',
    phone: client?.phone || '',
    email: client?.email || '',
    address: client?.address || '',
    city: client?.city || '',
    rc: client?.rc || '',
    nif: client?.nif || '',
    paymentTerms: client?.paymentTerms ?? 30
  });
  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Code *</label>
          <input className="input" value={form.code} onChange={e => set('code', e.target.value)} required placeholder="CLT-001" />
        </div>
        <div>
          <label className="label">Délai paiement (jours)</label>
          <input type="number" min="0" className="input" value={form.paymentTerms} onChange={e => set('paymentTerms', +e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Raison sociale *</label>
        <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Contact</label>
          <input className="input" value={form.contact} onChange={e => set('contact', e.target.value)} />
        </div>
        <div>
          <label className="label">Téléphone</label>
          <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div>
          <label className="label">Ville</label>
          <input className="input" value={form.city} onChange={e => set('city', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Adresse</label>
        <input className="input" value={form.address} onChange={e => set('address', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">RC (Registre de commerce)</label>
          <input className="input" value={form.rc} onChange={e => set('rc', e.target.value)} />
        </div>
        <div>
          <label className="label">NIF</label>
          <input className="input" value={form.nif} onChange={e => set('nif', e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button type="submit" className="btn-primary">{client ? 'Modifier' : 'Créer'}</button>
      </div>
    </form>
  );
}

export default function Clients() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Client | null>(null);

  const { data: stats } = useQuery({
    queryKey: ['client-stats'],
    queryFn: () => clientsApi.getStats().then(r => r.data as { total: number; active: number; withOrders: number })
  });

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => clientsApi.getAll({ search: search || undefined }).then(r => r.data as Client[])
  });

  const createMut = useMutation({
    mutationFn: (d: unknown) => clientsApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); qc.invalidateQueries({ queryKey: ['client-stats'] }); setShowForm(false); }
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => clientsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setEditItem(null); }
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total clients', value: stats?.total || 0, color: 'text-gray-700' },
          { label: 'Actifs', value: stats?.active || 0, color: 'text-green-600' },
          { label: 'Avec commandes', value: stats?.withOrders || 0, color: 'text-primary-600' }
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 items-center justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> Nouveau client</button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-gray-400">Chargement...</div> :
          clients.length === 0 ? (
            <div className="p-12 text-center"><Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucun client</p></div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-header">Code</th>
                  <th className="table-header">Raison sociale</th>
                  <th className="table-header">Contact</th>
                  <th className="table-header">Localisation</th>
                  <th className="table-header">Délai paiement</th>
                  <th className="table-header">Identifiants fiscaux</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clients.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="table-cell font-mono text-xs text-gray-500">{c.code}</td>
                    <td className="table-cell font-semibold text-gray-900">{c.name}</td>
                    <td className="table-cell text-sm">
                      <div className="space-y-0.5">
                        {c.contact && <p>{c.contact}</p>}
                        {c.phone && <p className="flex items-center gap-1 text-gray-500"><Phone className="w-3 h-3" />{c.phone}</p>}
                        {c.email && <p className="flex items-center gap-1 text-gray-500"><Mail className="w-3 h-3" />{c.email}</p>}
                      </div>
                    </td>
                    <td className="table-cell text-sm">
                      {c.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" />{c.city}</span>}
                    </td>
                    <td className="table-cell text-sm">{c.paymentTerms} jours</td>
                    <td className="table-cell text-xs text-gray-400">
                      {c.nif && <p>NIF: {c.nif}</p>}
                      {c.rc && <p>RC: {c.rc}</p>}
                    </td>
                    <td className="table-cell">
                      <button onClick={() => setEditItem(c)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nouveau client" size="lg">
        <ClientForm onSave={d => createMut.mutate(d)} onClose={() => setShowForm(false)} />
      </Modal>
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Modifier le client" size="lg">
        {editItem && <ClientForm client={editItem} onSave={d => updateMut.mutate({ id: editItem.id, data: d })} onClose={() => setEditItem(null)} />}
      </Modal>
    </div>
  );
}
