import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Receipt, DollarSign, AlertTriangle, Printer } from 'lucide-react';
import { invoicesApi, deliveriesApi } from '../services/api';
import type { Invoice, InvoiceStatus, Delivery, PaymentMethod } from '../types';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { format, isPast } from 'date-fns';
import PrintModal from '../components/print/PrintModal';
import FactureClient from '../components/print/FactureClient';

const statusConfig: Record<InvoiceStatus, { label: string; badge: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
  BROUILLON: { label: 'Brouillon', badge: 'default' },
  EMISE: { label: 'Émise', badge: 'info' },
  PARTIELLEMENT_PAYEE: { label: 'Part. payée', badge: 'warning' },
  PAYEE: { label: 'Payée', badge: 'success' },
  ANNULEE: { label: 'Annulée', badge: 'danger' }
};

const paymentMethodLabel: Record<PaymentMethod, string> = {
  VIREMENT: 'Virement', CHEQUE: 'Chèque', ESPECES: 'Espèces', TRAITE: 'Traite', AUTRE: 'Autre'
};

function CreateInvoiceForm({ onSave, onClose }: { onSave: (d: unknown) => void; onClose: () => void }) {
  const { data: deliveries = [] } = useQuery({
    queryKey: ['deliveries-uninvoiced'],
    queryFn: () => deliveriesApi.getAll({ status: 'SIGNE' }).then(r => (r.data as Delivery[]).filter(d => !d.invoice))
  });
  const [form, setForm] = useState({ deliveryId: '', tvaRate: 19, timbre: 0, dueDate: '', notes: '' });

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div>
        <label className="label">Bon de livraison *</label>
        <select className="input" value={form.deliveryId} onChange={e => setForm(f => ({ ...f, deliveryId: e.target.value }))} required>
          <option value="">— Sélectionner un BL signé —</option>
          {deliveries.map(d => <option key={d.id} value={d.id}>{d.deliveryNumber} — {d.order.client.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">TVA (%)</label>
          <input type="number" min="0" max="100" className="input" value={form.tvaRate} onChange={e => setForm(f => ({ ...f, tvaRate: +e.target.value }))} />
        </div>
        <div>
          <label className="label">Timbre fiscal (DZD)</label>
          <input type="number" min="0" step="0.01" className="input" value={form.timbre} onChange={e => setForm(f => ({ ...f, timbre: +e.target.value }))} />
        </div>
        <div>
          <label className="label">Date échéance</label>
          <input type="date" className="input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button type="submit" className="btn-primary"><Receipt className="w-4 h-4" /> Générer facture</button>
      </div>
    </form>
  );
}

function PaymentForm({ invoiceId, onSave, onClose }: { invoiceId: string; onSave: (d: unknown) => void; onClose: () => void }) {
  const [form, setForm] = useState({ amount: 0, method: 'VIREMENT' as PaymentMethod, reference: '', paymentDate: format(new Date(), 'yyyy-MM-dd'), notes: '' });
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Montant (DZD) *</label>
          <input type="number" min="0" step="0.01" className="input" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: +e.target.value }))} required />
        </div>
        <div>
          <label className="label">Mode de paiement</label>
          <select className="input" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value as PaymentMethod }))}>
            {(Object.keys(paymentMethodLabel) as PaymentMethod[]).map(m => <option key={m} value={m}>{paymentMethodLabel[m]}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Référence (N° chèque/virement)</label>
          <input className="input" value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} />
        </div>
        <div>
          <label className="label">Date encaissement</label>
          <input type="date" className="input" value={form.paymentDate} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))} />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button type="submit" className="btn-primary"><DollarSign className="w-4 h-4" /> Enregistrer</button>
      </div>
    </form>
  );
}

export default function Invoices() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
  const [printId, setPrintId] = useState<string | null>(null);

  const { data: summary } = useQuery({
    queryKey: ['invoice-summary'],
    queryFn: () => invoicesApi.getSummary().then(r => r.data as { total: number; unpaid: number; overdue: number; caMonth: number })
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoicesApi.getAll().then(r => r.data as Invoice[])
  });

  const createMut = useMutation({
    mutationFn: (d: unknown) => invoicesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); qc.invalidateQueries({ queryKey: ['invoice-summary'] }); setShowCreate(false); }
  });

  const payMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => invoicesApi.addPayment(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); qc.invalidateQueries({ queryKey: ['invoice-summary'] }); setPayInvoice(null); }
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total factures', value: summary?.total || 0, color: 'text-gray-700' },
          { label: 'Impayées', value: summary?.unpaid || 0, color: 'text-orange-600' },
          { label: 'En retard', value: summary?.overdue || 0, color: 'text-red-600' },
          { label: 'CA du mois', value: `${Number(summary?.caMonth || 0).toLocaleString('fr-DZ')} DZD`, color: 'text-green-600' }
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4" /> Nouvelle facture</button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-gray-400">Chargement...</div> :
          invoices.length === 0 ? (
            <div className="p-12 text-center"><Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucune facture</p></div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-header">N° Facture</th>
                  <th className="table-header">Client</th>
                  <th className="table-header">BL</th>
                  <th className="table-header text-right">Montant TTC</th>
                  <th className="table-header text-right">Payé</th>
                  <th className="table-header text-right">Reste</th>
                  <th className="table-header">Échéance</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map(inv => {
                  const reste = Number(inv.totalAmount) - Number(inv.amountPaid);
                  const isOverdue = isPast(new Date(inv.dueDate)) && !['PAYEE', 'ANNULEE'].includes(inv.status);
                  return (
                    <tr key={inv.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                      <td className="table-cell font-mono font-semibold text-gray-600">{inv.invoiceNumber}</td>
                      <td className="table-cell font-medium">{inv.client.name}</td>
                      <td className="table-cell text-xs text-gray-500">{inv.delivery.deliveryNumber}</td>
                      <td className="table-cell text-right font-bold">{Number(inv.totalAmount).toLocaleString('fr-DZ')} DZD</td>
                      <td className="table-cell text-right text-green-600">{Number(inv.amountPaid).toLocaleString('fr-DZ')}</td>
                      <td className="table-cell text-right font-bold text-red-600">{reste > 0 ? `${reste.toLocaleString('fr-DZ')} DZD` : '—'}</td>
                      <td className="table-cell">
                        <div className={`flex items-center gap-1 text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                          {isOverdue && <AlertTriangle className="w-3.5 h-3.5" />}
                          {format(new Date(inv.dueDate), 'dd/MM/yyyy')}
                        </div>
                      </td>
                      <td className="table-cell"><Badge variant={statusConfig[inv.status].badge}>{statusConfig[inv.status].label}</Badge></td>
                      <td className="table-cell">
                        <div className="flex gap-1">
                          {!['PAYEE', 'ANNULEE'].includes(inv.status) && (
                            <button onClick={() => setPayInvoice(inv)} className="p-1.5 hover:bg-green-50 rounded text-green-500" title="Encaisser">
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => setPrintId(inv.id)} className="p-1.5 hover:bg-purple-50 rounded text-purple-500" title="Imprimer">
                            <Printer className="w-3.5 h-3.5" />
                          </button>
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

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Générer une facture">
        <CreateInvoiceForm onSave={d => createMut.mutate(d)} onClose={() => setShowCreate(false)} />
      </Modal>
      <Modal isOpen={!!payInvoice} onClose={() => setPayInvoice(null)} title="Enregistrer un paiement">
        {payInvoice && <PaymentForm invoiceId={payInvoice.id} onSave={d => payMut.mutate({ id: payInvoice.id, data: d })} onClose={() => setPayInvoice(null)} />}
      </Modal>
      <PrintModal isOpen={!!printId} onClose={() => setPrintId(null)} title="Facture Client">
        {printId && <FactureClient invoiceId={printId} />}
      </PrintModal>
    </div>
  );
}
