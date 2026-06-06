import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Users, Edit2, UserCheck, Tag } from 'lucide-react';
import { employeesApi, modelsApi } from '../services/api';
import { Employee, CoutureModel, PaymentType } from '../types';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { format } from 'date-fns';

const PAYMENT_TYPES: { value: PaymentType; label: string }[] = [
  { value: 'PIECE', label: 'Par pièce' },
  { value: 'CHAINE', label: 'Par chaîne' },
  { value: 'HORAIRE', label: 'Horaire' },
  { value: 'MENSUEL', label: 'Mensuel fixe' }
];

const paymentBadge = (t: PaymentType) => {
  const m: Record<PaymentType, 'info' | 'purple' | 'success' | 'default'> = { PIECE: 'info', CHAINE: 'purple', HORAIRE: 'success', MENSUEL: 'default' };
  return m[t];
};

function EmployeeForm({ emp, onSave, onClose }: { emp?: Employee; onSave: (d: unknown) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    employeeId: emp?.employeeId || '',
    firstName: emp?.firstName || '',
    lastName: emp?.lastName || '',
    position: emp?.position || '',
    department: emp?.department || '',
    paymentType: emp?.paymentType || 'MENSUEL' as PaymentType,
    hourlyRate: emp?.hourlyRate || '',
    monthlyRate: emp?.monthlyRate || '',
    phone: emp?.phone || '',
    hireDate: emp ? format(new Date(emp.hireDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, hireDate: new Date(form.hireDate) }); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Matricule *</label>
          <input className="input" value={form.employeeId} onChange={e => set('employeeId', e.target.value)} required placeholder="EMP-001" />
        </div>
        <div>
          <label className="label">Poste *</label>
          <input className="input" value={form.position} onChange={e => set('position', e.target.value)} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Prénom *</label>
          <input className="input" value={form.firstName} onChange={e => set('firstName', e.target.value)} required />
        </div>
        <div>
          <label className="label">Nom *</label>
          <input className="input" value={form.lastName} onChange={e => set('lastName', e.target.value)} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Département</label>
          <input className="input" value={form.department} onChange={e => set('department', e.target.value)} />
        </div>
        <div>
          <label className="label">Téléphone</label>
          <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Mode de paiement</label>
          <select className="input" value={form.paymentType} onChange={e => set('paymentType', e.target.value)}>
            {PAYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Date d'embauche</label>
          <input type="date" className="input" value={form.hireDate} onChange={e => set('hireDate', e.target.value)} required />
        </div>
      </div>
      {(form.paymentType === 'MENSUEL' || form.paymentType === 'CHAINE') && (
        <div>
          <label className="label">Salaire mensuel (DZD)</label>
          <input type="number" min="0" className="input" value={form.monthlyRate} onChange={e => set('monthlyRate', e.target.value)} />
        </div>
      )}
      {form.paymentType === 'HORAIRE' && (
        <div>
          <label className="label">Taux horaire (DZD/h)</label>
          <input type="number" min="0" step="0.01" className="input" value={form.hourlyRate} onChange={e => set('hourlyRate', e.target.value)} />
        </div>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button type="submit" className="btn-primary">{emp ? 'Modifier' : 'Créer'}</button>
      </div>
    </form>
  );
}

function PieceRateForm({ employeeId, onSave, onClose }: { employeeId: string; onSave: (d: unknown) => void; onClose: () => void }) {
  const { data: models = [] } = useQuery({ queryKey: ['models'], queryFn: () => modelsApi.getAll().then(r => r.data as CoutureModel[]) });
  const [selectedModel, setSelectedModel] = useState('');
  const [form, setForm] = useState({ operationId: '', operationName: '', rate: 0, effectiveDate: format(new Date(), 'yyyy-MM-dd') });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const ops = models.find(m => m.id === selectedModel)?.operations || [];

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, effectiveDate: new Date(form.effectiveDate) }); }} className="space-y-4">
      <div>
        <label className="label">Modèle</label>
        <select className="input" value={selectedModel} onChange={e => setSelectedModel(e.target.value)}>
          <option value="">— Tous modèles / saisie libre —</option>
          {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      {selectedModel && ops.length > 0 ? (
        <div>
          <label className="label">Opération</label>
          <select className="input" value={form.operationId} onChange={e => {
            const op = ops.find(o => o.id === e.target.value);
            set('operationId', e.target.value);
            if (op) set('operationName', op.name);
          }}>
            <option value="">— Sélectionner —</option>
            {ops.map(op => <option key={op.id} value={op.id}>{op.sequence}. {op.name}</option>)}
          </select>
        </div>
      ) : (
        <div>
          <label className="label">Nom de l'opération *</label>
          <input className="input" value={form.operationName} onChange={e => set('operationName', e.target.value)} required />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Tarif par pièce (DZD) *</label>
          <input type="number" min="0" step="0.0001" className="input" value={form.rate} onChange={e => set('rate', +e.target.value)} required />
        </div>
        <div>
          <label className="label">Date d'effet</label>
          <input type="date" className="input" value={form.effectiveDate} onChange={e => set('effectiveDate', e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button type="submit" className="btn-primary">Enregistrer</button>
      </div>
    </form>
  );
}

function ProductionForm({ employeeId, onSave, onClose }: { employeeId: string; onSave: (d: unknown) => void; onClose: () => void }) {
  const { data: models = [] } = useQuery({ queryKey: ['models'], queryFn: () => modelsApi.getAll().then(r => r.data as CoutureModel[]) });
  const [selectedModel, setSelectedModel] = useState('');
  const [form, setForm] = useState({ modelId: '', operationId: '', quantity: 0, pieceRate: 0, date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
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
      {ops.length > 0 && (
        <div>
          <label className="label">Opération</label>
          <select className="input" value={form.operationId} onChange={e => set('operationId', e.target.value)}>
            <option value="">— Sélectionner —</option>
            {ops.map(op => <option key={op.id} value={op.id}>{op.sequence}. {op.name}</option>)}
          </select>
        </div>
      )}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Quantité *</label>
          <input type="number" min="1" className="input" value={form.quantity} onChange={e => set('quantity', +e.target.value)} required />
        </div>
        <div>
          <label className="label">Tarif pièce (DZD) *</label>
          <input type="number" min="0" step="0.0001" className="input" value={form.pieceRate} onChange={e => set('pieceRate', +e.target.value)} required />
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
      </div>
      <div className="p-3 bg-green-50 rounded-lg">
        <p className="text-sm font-semibold text-green-700">Total: {(form.quantity * form.pieceRate).toFixed(2)} DZD</p>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button type="submit" className="btn-primary">Enregistrer</button>
      </div>
    </form>
  );
}

export default function Employees() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Employee | null>(null);
  const [rateItem, setRateItem] = useState<Employee | null>(null);
  const [productionItem, setProductionItem] = useState<Employee | null>(null);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees', search, typeFilter],
    queryFn: () => employeesApi.getAll({ search: search || undefined, paymentType: typeFilter || undefined }).then(r => r.data as Employee[])
  });

  const createMut = useMutation({ mutationFn: (d: unknown) => employeesApi.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setShowForm(false); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: { id: string; data: unknown }) => employeesApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setEditItem(null); } });
  const rateMut = useMutation({ mutationFn: ({ id, data }: { id: string; data: unknown }) => employeesApi.addPieceRate(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setRateItem(null); } });
  const prodMut = useMutation({ mutationFn: ({ id, data }: { id: string; data: unknown }) => employeesApi.addProduction(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setProductionItem(null); } });

  return (
    <div className="space-y-5">
      <div className="flex gap-3 items-center justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-44" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">Tous types</option>
            {PAYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> Nouvel employé</button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-gray-400">Chargement...</div> :
          employees.length === 0 ? (
            <div className="p-12 text-center"><Users className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucun employé</p></div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Matricule</th>
                  <th className="table-header">Nom complet</th>
                  <th className="table-header">Poste</th>
                  <th className="table-header">Département</th>
                  <th className="table-header">Mode paie</th>
                  <th className="table-header text-right">Salaire/Taux</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {employees.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="table-cell font-mono text-xs font-semibold text-gray-500">{e.employeeId}</td>
                    <td className="table-cell font-medium text-gray-900">{e.firstName} {e.lastName}</td>
                    <td className="table-cell text-gray-600">{e.position}</td>
                    <td className="table-cell text-gray-500">{e.department || '—'}</td>
                    <td className="table-cell"><Badge variant={paymentBadge(e.paymentType)}>{PAYMENT_TYPES.find(t => t.value === e.paymentType)?.label}</Badge></td>
                    <td className="table-cell text-right">
                      {e.monthlyRate ? `${Number(e.monthlyRate).toLocaleString('fr-DZ')} DZD/mois` :
                       e.hourlyRate ? `${Number(e.hourlyRate).toLocaleString('fr-DZ')} DZD/h` : '—'}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditItem(e)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500" title="Modifier"><Edit2 className="w-3.5 h-3.5" /></button>
                        {(e.paymentType === 'PIECE' || e.paymentType === 'CHAINE') && (
                          <>
                            <button onClick={() => setRateItem(e)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500" title="Tarifs pièce"><Tag className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setProductionItem(e)} className="p-1.5 hover:bg-green-50 rounded-lg text-green-500" title="Saisir production"><UserCheck className="w-3.5 h-3.5" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nouvel employé" size="lg">
        <EmployeeForm onSave={d => createMut.mutate(d)} onClose={() => setShowForm(false)} />
      </Modal>
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Modifier l'employé" size="lg">
        {editItem && <EmployeeForm emp={editItem} onSave={d => updateMut.mutate({ id: editItem.id, data: d })} onClose={() => setEditItem(null)} />}
      </Modal>
      <Modal isOpen={!!rateItem} onClose={() => setRateItem(null)} title={`Tarifs pièce — ${rateItem?.firstName} ${rateItem?.lastName}`} size="lg">
        {rateItem && <PieceRateForm employeeId={rateItem.id} onSave={d => rateMut.mutate({ id: rateItem.id, data: d })} onClose={() => setRateItem(null)} />}
      </Modal>
      <Modal isOpen={!!productionItem} onClose={() => setProductionItem(null)} title={`Saisir production — ${productionItem?.firstName} ${productionItem?.lastName}`} size="lg">
        {productionItem && <ProductionForm employeeId={productionItem.id} onSave={d => prodMut.mutate({ id: productionItem.id, data: d })} onClose={() => setProductionItem(null)} />}
      </Modal>
    </div>
  );
}
