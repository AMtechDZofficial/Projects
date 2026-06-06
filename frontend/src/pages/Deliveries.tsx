import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Truck, CheckCircle, Printer } from 'lucide-react';
import { deliveriesApi, clientOrdersApi, modelsApi } from '../services/api';
import type { Delivery, DeliveryStatus, ClientOrder, CoutureModel } from '../types';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { format } from 'date-fns';
import PrintModal from '../components/print/PrintModal';
import BonDeLivraison from '../components/print/BonDeLivraison';

const statusConfig: Record<DeliveryStatus, { label: string; badge: 'default' | 'info' | 'success' | 'warning' }> = {
  EN_PREPARATION: { label: 'En préparation', badge: 'warning' },
  LIVRE: { label: 'Livré', badge: 'info' },
  SIGNE: { label: 'Signé', badge: 'success' },
  RETOUR_PARTIEL: { label: 'Retour partiel', badge: 'default' }
};

const SIZES = ['36', '38', '40', '42', '44', '46', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Unique'];

function DeliveryForm({ onSave, onClose }: { onSave: (d: unknown) => void; onClose: () => void }) {
  const { data: orders = [] } = useQuery({
    queryKey: ['client-orders-active'],
    queryFn: () => clientOrdersApi.getAll({ status: 'EN_PRODUCTION' }).then(r => r.data as ClientOrder[])
  });
  const { data: models = [] } = useQuery({ queryKey: ['models'], queryFn: () => modelsApi.getAll().then(r => r.data as CoutureModel[]) });

  const [form, setForm] = useState({ orderId: '', deliveryDate: format(new Date(), 'yyyy-MM-dd'), carrierName: '', trackingNumber: '', notes: '' });
  const [lines, setLines] = useState([{ modelId: '', colorRef: '', sizeBreakdown: {} as Record<string, number>, quantity: 0 }]);

  const addLine = () => setLines(l => [...l, { modelId: '', colorRef: '', sizeBreakdown: {}, quantity: 0 }]);
  const setLine = (i: number, k: string, v: unknown) => setLines(l => l.map((line, idx) => idx === i ? { ...line, [k]: v } : line));
  const setSizeQty = (lineIdx: number, size: string, qty: number) => {
    setLines(l => l.map((line, idx) => {
      if (idx !== lineIdx) return line;
      const sb = { ...line.sizeBreakdown, [size]: qty };
      if (qty === 0) delete sb[size];
      return { ...line, sizeBreakdown: sb, quantity: Object.values(sb).reduce((s, q) => s + q, 0) };
    }));
  };

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, lines }); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Commande client *</label>
          <select className="input" value={form.orderId} onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))} required>
            <option value="">— Sélectionner —</option>
            {orders.map(o => <option key={o.id} value={o.id}>{o.orderNumber} — {o.client.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Date livraison</label>
          <input type="date" className="input" value={form.deliveryDate} onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Transporteur</label>
          <input className="input" value={form.carrierName} onChange={e => setForm(f => ({ ...f, carrierName: e.target.value }))} />
        </div>
        <div>
          <label className="label">N° tracking</label>
          <input className="input" value={form.trackingNumber} onChange={e => setForm(f => ({ ...f, trackingNumber: e.target.value }))} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Articles livrés</label>
          <button type="button" onClick={addLine} className="text-primary-600 text-xs font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Ajouter</button>
        </div>
        {lines.map((line, i) => (
          <div key={i} className="p-3 border border-gray-200 rounded-xl space-y-2 mb-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Modèle *</label>
                <select className="input text-sm" value={line.modelId} onChange={e => setLine(i, 'modelId', e.target.value)} required>
                  <option value="">— Modèle —</option>
                  {models.map(m => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">Coloris</label>
                <input className="input text-sm" value={line.colorRef} onChange={e => setLine(i, 'colorRef', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label text-xs">Qtés par taille</label>
              <div className="flex flex-wrap gap-2">
                {SIZES.slice(0, 9).map(size => (
                  <div key={size} className="flex flex-col items-center gap-0.5">
                    <label className="text-xs text-gray-400">{size}</label>
                    <input type="number" min="0" className="input text-center text-xs w-12 py-1 px-1"
                      value={line.sizeBreakdown[size] || ''} onChange={e => setSizeQty(i, size, +e.target.value)} placeholder="0" />
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500">Total: <strong>{line.quantity} pcs</strong></p>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button type="submit" className="btn-primary"><Truck className="w-4 h-4" /> Créer BL</button>
      </div>
    </form>
  );
}

export default function Deliveries() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [printId, setPrintId] = useState<string | null>(null);

  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ['deliveries'],
    queryFn: () => deliveriesApi.getAll().then(r => r.data as Delivery[])
  });

  const createMut = useMutation({
    mutationFn: (d: unknown) => deliveriesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deliveries'] }); setShowForm(false); }
  });

  const signMut = useMutation({
    mutationFn: (id: string) => deliveriesApi.sign(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deliveries'] })
  });

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> Nouvelle livraison</button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-gray-400">Chargement...</div> :
          deliveries.length === 0 ? (
            <div className="p-12 text-center"><Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucune livraison</p></div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-header">N° BL</th>
                  <th className="table-header">Commande / Client</th>
                  <th className="table-header">Articles</th>
                  <th className="table-header">Date livraison</th>
                  <th className="table-header">Transporteur</th>
                  <th className="table-header">Facture</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {deliveries.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="table-cell font-mono font-semibold text-gray-600">{d.deliveryNumber}</td>
                    <td className="table-cell">
                      <p className="font-medium">{d.order.client.name}</p>
                      <p className="text-xs text-gray-400">{d.order.orderNumber}</p>
                    </td>
                    <td className="table-cell text-sm">
                      {d.lines.map(l => (
                        <div key={l.id} className="text-xs">
                          {l.model.name} — <strong>{l.quantity} pcs</strong>
                          {l.colorRef && <span className="text-gray-400"> ({l.colorRef})</span>}
                        </div>
                      ))}
                    </td>
                    <td className="table-cell text-sm">{format(new Date(d.deliveryDate), 'dd/MM/yyyy')}</td>
                    <td className="table-cell text-sm">{d.carrierName || '—'}</td>
                    <td className="table-cell">
                      {d.invoice ? <Badge variant="success">{d.invoice.invoiceNumber}</Badge> : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="table-cell"><Badge variant={statusConfig[d.status].badge}>{statusConfig[d.status].label}</Badge></td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        {d.status === 'LIVRE' && (
                          <button onClick={() => signMut.mutate(d.id)} className="p-1.5 hover:bg-green-50 rounded text-green-500" title="Marquer signé">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => setPrintId(d.id)} className="p-1.5 hover:bg-purple-50 rounded text-purple-500" title="Imprimer BL">
                          <Printer className="w-3.5 h-3.5" />
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

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nouvelle livraison" size="lg">
        <DeliveryForm onSave={d => createMut.mutate(d)} onClose={() => setShowForm(false)} />
      </Modal>
      <PrintModal isOpen={!!printId} onClose={() => setPrintId(null)} title="Bon de Livraison">
        {printId && <BonDeLivraison deliveryId={printId} />}
      </PrintModal>
    </div>
  );
}
