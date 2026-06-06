import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ShoppingBag, AlertTriangle, Calendar, CheckCircle, Truck } from 'lucide-react';
import { clientOrdersApi, clientsApi, modelsApi } from '../services/api';
import type { ClientOrder, ClientOrderStatus, Client, CoutureModel } from '../types';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { format, isPast } from 'date-fns';

const statusConfig: Record<ClientOrderStatus, { label: string; badge: 'default' | 'warning' | 'info' | 'success' | 'danger' | 'purple' }> = {
  DEVIS: { label: 'Devis', badge: 'default' },
  CONFIRMEE: { label: 'Confirmée', badge: 'info' },
  EN_PRODUCTION: { label: 'En production', badge: 'warning' },
  PARTIELLEMENT_LIVREE: { label: 'Part. livrée', badge: 'purple' },
  LIVREE: { label: 'Livrée', badge: 'success' },
  FACTUREE: { label: 'Facturée', badge: 'info' },
  PAYEE: { label: 'Payée', badge: 'success' },
  ANNULEE: { label: 'Annulée', badge: 'danger' }
};

const SIZES = ['36', '38', '40', '42', '44', '46', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Unique'];

function OrderForm({ onSave, onClose }: { onSave: (d: unknown) => void; onClose: () => void }) {
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => clientsApi.getAll().then(r => r.data as Client[]) });
  const { data: models = [] } = useQuery({ queryKey: ['models'], queryFn: () => modelsApi.getAll().then(r => r.data as CoutureModel[]) });

  const [form, setForm] = useState({ clientId: '', deliveryDate: '', depositAmount: 0, notes: '' });
  const [lines, setLines] = useState([{ modelId: '', colorRef: '', sizeBreakdown: {} as Record<string, number>, quantity: 0, unitPrice: 0 }]);

  const addLine = () => setLines(l => [...l, { modelId: '', colorRef: '', sizeBreakdown: {}, quantity: 0, unitPrice: 0 }]);
  const removeLine = (i: number) => setLines(l => l.filter((_, idx) => idx !== i));
  const setLine = (i: number, k: string, v: unknown) => setLines(l => l.map((line, idx) => idx === i ? { ...line, [k]: v } : line));
  const setSizeQty = (lineIdx: number, size: string, qty: number) => {
    setLines(l => l.map((line, idx) => {
      if (idx !== lineIdx) return line;
      const sb = { ...line.sizeBreakdown, [size]: qty };
      if (qty === 0) delete sb[size];
      const total = Object.values(sb).reduce((s, q) => s + q, 0);
      return { ...line, sizeBreakdown: sb, quantity: total };
    }));
  };

  const total = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, lines, depositAmount: +form.depositAmount }); }} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Client *</label>
          <select className="input" value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} required>
            <option value="">— Sélectionner —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </select>
        </div>
        <div>
          <label className="label">Date livraison souhaitée *</label>
          <input type="date" className="input" value={form.deliveryDate} onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))} required />
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">Articles commandés</h4>
          <button type="button" onClick={addLine} className="text-primary-600 hover:text-primary-700 text-xs font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Ajouter</button>
        </div>
        <div className="space-y-4">
          {lines.map((line, i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-xl space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label text-xs">Modèle *</label>
                  <select className="input text-sm" value={line.modelId} onChange={e => setLine(i, 'modelId', e.target.value)} required>
                    <option value="">— Modèle —</option>
                    {models.map(m => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Coloris / Ref</label>
                  <input className="input text-sm" value={line.colorRef} onChange={e => setLine(i, 'colorRef', e.target.value)} placeholder="Bleu marine, ref. BM01..." />
                </div>
                <div>
                  <label className="label text-xs">Prix unitaire (DZD)</label>
                  <input type="number" min="0" step="0.01" className="input text-sm" value={line.unitPrice} onChange={e => setLine(i, 'unitPrice', +e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="label text-xs">Répartition par taille</label>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map(size => (
                    <div key={size} className="flex flex-col items-center gap-1">
                      <label className="text-xs text-gray-500">{size}</label>
                      <input
                        type="number" min="0"
                        className="input text-center text-xs w-14 py-1 px-1"
                        value={line.sizeBreakdown[size] || ''}
                        onChange={e => setSizeQty(i, size, +e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total: <strong>{line.quantity} pcs</strong> × {line.unitPrice.toLocaleString('fr-DZ')} = <strong className="text-primary-600">{(line.quantity * line.unitPrice).toLocaleString('fr-DZ')} DZD</strong></span>
                {lines.length > 1 && <button type="button" onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600 text-xs">Supprimer</button>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-primary-50 rounded-xl flex items-center justify-between">
        <div>
          <label className="label text-xs">Acompte reçu (DZD)</label>
          <input type="number" min="0" className="input max-w-[160px]" value={form.depositAmount} onChange={e => setForm(f => ({ ...f, depositAmount: +e.target.value }))} />
        </div>
        <div className="text-right">
          <p className="text-sm text-primary-600">TOTAL COMMANDE</p>
          <p className="text-2xl font-bold text-primary-700">{total.toLocaleString('fr-DZ')} DZD</p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button type="submit" className="btn-primary">Créer la commande</button>
      </div>
    </form>
  );
}

export default function ClientOrders() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClient, setFilterClient] = useState('');

  const { data: summary } = useQuery({
    queryKey: ['orders-summary'],
    queryFn: () => clientOrdersApi.getSummary().then(r => r.data as { total: number; enCours: number; retard: number; caTotal: number })
  });

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => clientsApi.getAll().then(r => r.data as Client[]) });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['client-orders', filterStatus, filterClient],
    queryFn: () => clientOrdersApi.getAll({ status: filterStatus || undefined, clientId: filterClient || undefined }).then(r => r.data as ClientOrder[])
  });

  const createMut = useMutation({
    mutationFn: (d: unknown) => clientOrdersApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['client-orders'] }); qc.invalidateQueries({ queryKey: ['orders-summary'] }); setShowForm(false); }
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => clientOrdersApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-orders'] })
  });

  const NEXT_STATUS: Partial<Record<ClientOrderStatus, ClientOrderStatus>> = {
    DEVIS: 'CONFIRMEE',
    CONFIRMEE: 'EN_PRODUCTION',
    EN_PRODUCTION: 'LIVREE'
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total commandes', value: summary?.total || 0, color: 'text-gray-700' },
          { label: 'En cours', value: summary?.enCours || 0, color: 'text-blue-600' },
          { label: 'En retard', value: summary?.retard || 0, color: 'text-red-600' },
          { label: 'CA total', value: `${Number(summary?.caTotal || 0).toLocaleString('fr-DZ')} DZD`, color: 'text-green-600' }
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 items-center justify-between">
        <div className="flex gap-2">
          <select className="input max-w-[180px]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Tous statuts</option>
            {(Object.keys(statusConfig) as ClientOrderStatus[]).map(s => (
              <option key={s} value={s}>{statusConfig[s].label}</option>
            ))}
          </select>
          <select className="input max-w-[180px]" value={filterClient} onChange={e => setFilterClient(e.target.value)}>
            <option value="">Tous clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> Nouvelle commande</button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-gray-400">Chargement...</div> :
          orders.length === 0 ? (
            <div className="p-12 text-center"><ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucune commande</p></div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-header">N° Commande</th>
                  <th className="table-header">Client</th>
                  <th className="table-header">Articles</th>
                  <th className="table-header text-right">Montant</th>
                  <th className="table-header">Date livraison</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(o => {
                  const isLate = isPast(new Date(o.deliveryDate)) && !['LIVREE', 'FACTUREE', 'PAYEE', 'ANNULEE'].includes(o.status);
                  const nextStatus = NEXT_STATUS[o.status];
                  return (
                    <tr key={o.id} className={`hover:bg-gray-50 ${isLate ? 'bg-red-50' : ''}`}>
                      <td className="table-cell font-mono font-semibold text-gray-600">{o.orderNumber}</td>
                      <td className="table-cell">
                        <p className="font-medium">{o.client.name}</p>
                        {o.client.city && <p className="text-xs text-gray-400">{o.client.city}</p>}
                      </td>
                      <td className="table-cell">
                        {o.lines.map(l => (
                          <div key={l.id} className="text-xs">
                            <span className="font-medium">{l.model.name}</span>
                            {l.colorRef && <span className="text-gray-400 ml-1">— {l.colorRef}</span>}
                            <span className="ml-1 text-gray-500">{l.quantity} pcs</span>
                          </div>
                        ))}
                      </td>
                      <td className="table-cell text-right font-bold">{Number(o.totalAmount).toLocaleString('fr-DZ')} DZD</td>
                      <td className="table-cell">
                        <div className={`flex items-center gap-1 text-sm ${isLate ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                          {isLate && <AlertTriangle className="w-3.5 h-3.5" />}
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(o.deliveryDate), 'dd/MM/yyyy')}
                        </div>
                      </td>
                      <td className="table-cell"><Badge variant={statusConfig[o.status].badge}>{statusConfig[o.status].label}</Badge></td>
                      <td className="table-cell">
                        <div className="flex gap-1">
                          {nextStatus && (
                            <button
                              onClick={() => statusMut.mutate({ id: o.id, status: nextStatus })}
                              className="p-1.5 hover:bg-blue-50 rounded text-blue-500 text-xs font-medium"
                              title={`→ ${statusConfig[nextStatus].label}`}
                            >
                              {nextStatus === 'CONFIRMEE' ? <CheckCircle className="w-3.5 h-3.5" /> : nextStatus === 'EN_PRODUCTION' ? <ShoppingBag className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        }
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nouvelle commande client" size="lg">
        <OrderForm onSave={d => createMut.mutate(d)} onClose={() => setShowForm(false)} />
      </Modal>
    </div>
  );
}
