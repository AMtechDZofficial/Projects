import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CreditCard, CheckCircle, DollarSign, Calculator, Printer } from 'lucide-react';
import { payrollApi, employeesApi } from '../services/api';
import type { Payroll, Employee } from '../types';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import PrintModal from '../components/print/PrintModal';
import BulletinDePaie from '../components/print/BulletinDePaie';
import { fr } from 'date-fns/locale';

const statusBadge = (s: Payroll['status']) => {
  const m = { BROUILLON: 'warning' as const, VALIDE: 'info' as const, PAYE: 'success' as const };
  return m[s];
};
const statusLabel = { BROUILLON: 'Brouillon', VALIDE: 'Validé', PAYE: 'Payé' };
const paymentTypeLabel = { PIECE: 'Pièce', CHAINE: 'Chaîne', HORAIRE: 'Horaire', MENSUEL: 'Mensuel' };

function CalculateForm({ onSave, onClose }: { onSave: (d: unknown) => void; onClose: () => void }) {
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => employeesApi.getAll().then(r => r.data as Employee[]) });
  const [form, setForm] = useState({
    employeeId: '',
    periodStart: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    periodEnd: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const calcMut = useMutation({
    mutationFn: () => payrollApi.calculate({ ...form, periodStart: new Date(form.periodStart), periodEnd: new Date(form.periodEnd) }),
    onSuccess: (res) => { onSave(res.data); }
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Employé *</label>
        <select className="input" value={form.employeeId} onChange={e => set('employeeId', e.target.value)} required>
          <option value="">— Sélectionner —</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Début période</label>
          <input type="date" className="input" value={form.periodStart} onChange={e => set('periodStart', e.target.value)} />
        </div>
        <div>
          <label className="label">Fin période</label>
          <input type="date" className="input" value={form.periodEnd} onChange={e => set('periodEnd', e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button onClick={() => calcMut.mutate()} disabled={!form.employeeId || calcMut.isPending} className="btn-primary">
          <Calculator className="w-4 h-4" /> {calcMut.isPending ? 'Calcul...' : 'Calculer'}
        </button>
      </div>
    </div>
  );
}

function PayrollPreview({ calculated, onConfirm, onClose }: { calculated: Partial<Payroll>; onConfirm: (d: unknown) => void; onClose: () => void }) {
  const [bonus, setBonus] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [notes, setNotes] = useState('');

  const total = (Number(calculated.baseSalary || 0) + Number(calculated.pieceEarnings || 0) + Number(calculated.chainBonus || 0) + bonus - deductions);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Salaire de base', value: calculated.baseSalary || 0, color: 'text-gray-700' },
          { label: 'Gains pièces', value: calculated.pieceEarnings || 0, color: 'text-green-600' },
          { label: 'Prime chaîne', value: calculated.chainBonus || 0, color: 'text-blue-600' }
        ].map(({ label, value, color }) => (
          <div key={label} className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-lg font-bold ${color}`}>{Number(value).toLocaleString('fr-DZ')} DZD</p>
          </div>
        ))}
        <div className="p-3 bg-primary-50 rounded-lg">
          <p className="text-xs text-primary-600">Total estimé</p>
          <p className="text-lg font-bold text-primary-700">{total.toLocaleString('fr-DZ')} DZD</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Prime supplémentaire (DZD)</label>
          <input type="number" min="0" className="input" value={bonus} onChange={e => setBonus(+e.target.value)} />
        </div>
        <div>
          <label className="label">Déductions (DZD)</label>
          <input type="number" min="0" className="input" value={deductions} onChange={e => setDeductions(+e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
      </div>
      <div className="p-4 bg-green-50 rounded-xl">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-green-800">TOTAL NET À PAYER</span>
          <span className="text-2xl font-bold text-green-700">{total.toLocaleString('fr-DZ')} DZD</span>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button onClick={() => onConfirm({ ...calculated, bonus, deductions, totalAmount: total, notes, status: 'BROUILLON' })} className="btn-primary">
          <Plus className="w-4 h-4" /> Créer bulletin
        </button>
      </div>
    </div>
  );
}

export default function Payroll() {
  const qc = useQueryClient();
  const [showCalc, setShowCalc] = useState(false);
  const [calculated, setCalculated] = useState<Partial<Payroll> | null>(null);
  const [printPayroll, setPrintPayroll] = useState<Payroll | null>(null);

  const { data: payrollData, isLoading } = useQuery({
    queryKey: ['payrolls'],
    queryFn: () => payrollApi.getAll().then(r => r.data as Payroll[])
  });

  const { data: summary } = useQuery({
    queryKey: ['payroll-summary'],
    queryFn: () => payrollApi.getSummary().then(r => r.data)
  });

  const createMut = useMutation({ mutationFn: (d: unknown) => payrollApi.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['payrolls', 'payroll-summary'] }); setCalculated(null); setShowCalc(false); } });
  const validateMut = useMutation({ mutationFn: (id: string) => payrollApi.validate(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['payrolls'] }) });
  const payMut = useMutation({ mutationFn: (id: string) => payrollApi.markPaid(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['payrolls'] }) });

  const payrolls = payrollData || [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total bulletins', value: (summary as { summary?: { totalPayrolls: number } })?.summary?.totalPayrolls || 0, color: 'text-gray-700' },
          { label: 'Masse salariale', value: `${Number((summary as { summary?: { totalAmount: number } })?.summary?.totalAmount || 0).toLocaleString('fr-DZ')} DZD`, color: 'text-primary-600' },
          { label: 'Gains pièces', value: `${Number((summary as { summary?: { totalPieceEarnings: number } })?.summary?.totalPieceEarnings || 0).toLocaleString('fr-DZ')} DZD`, color: 'text-green-600' },
          { label: 'Salaires fixes', value: `${Number((summary as { summary?: { totalBaseSalary: number } })?.summary?.totalBaseSalary || 0).toLocaleString('fr-DZ')} DZD`, color: 'text-blue-600' }
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowCalc(true)} className="btn-primary"><Calculator className="w-4 h-4" /> Calculer une paie</button>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Bulletins de paie</h3>
        </div>
        {isLoading ? <div className="p-8 text-center text-gray-400">Chargement...</div> :
          payrolls.length === 0 ? (
            <div className="p-12 text-center"><CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucun bulletin</p></div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-header">Employé</th>
                  <th className="table-header">Mode</th>
                  <th className="table-header">Période</th>
                  <th className="table-header text-right">Base</th>
                  <th className="table-header text-right">Pièces</th>
                  <th className="table-header text-right">Prime</th>
                  <th className="table-header text-right">Déductions</th>
                  <th className="table-header text-right font-bold">NET</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payrolls.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{p.employee.firstName} {p.employee.lastName}<br /><span className="text-xs text-gray-400">{p.employee.employeeId}</span></td>
                    <td className="table-cell"><Badge variant="default">{paymentTypeLabel[p.employee.paymentType]}</Badge></td>
                    <td className="table-cell text-xs">{format(new Date(p.periodStart), 'dd/MM/yyyy')} → {format(new Date(p.periodEnd), 'dd/MM/yyyy')}</td>
                    <td className="table-cell text-right">{Number(p.baseSalary).toLocaleString('fr-DZ')}</td>
                    <td className="table-cell text-right text-green-600">{Number(p.pieceEarnings).toLocaleString('fr-DZ')}</td>
                    <td className="table-cell text-right text-blue-600">{Number(p.bonus).toLocaleString('fr-DZ')}</td>
                    <td className="table-cell text-right text-red-500">-{Number(p.deductions).toLocaleString('fr-DZ')}</td>
                    <td className="table-cell text-right font-bold text-gray-900">{Number(p.totalAmount).toLocaleString('fr-DZ')} DZD</td>
                    <td className="table-cell"><Badge variant={statusBadge(p.status)}>{statusLabel[p.status]}</Badge></td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        {p.status === 'BROUILLON' && (
                          <button onClick={() => validateMut.mutate(p.id)} className="p-1.5 hover:bg-blue-50 rounded text-blue-500" title="Valider"><CheckCircle className="w-3.5 h-3.5" /></button>
                        )}
                        {p.status === 'VALIDE' && (
                          <button onClick={() => payMut.mutate(p.id)} className="p-1.5 hover:bg-green-50 rounded text-green-500" title="Marquer payé"><DollarSign className="w-3.5 h-3.5" /></button>
                        )}
                        <button onClick={() => setPrintPayroll(p)} className="p-1.5 hover:bg-purple-50 rounded text-purple-500" title="Imprimer bulletin"><Printer className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>

      <Modal isOpen={showCalc && !calculated} onClose={() => setShowCalc(false)} title="Calculer une paie">
        <CalculateForm onSave={(d) => setCalculated(d as Partial<Payroll>)} onClose={() => setShowCalc(false)} />
      </Modal>

      <Modal isOpen={!!calculated} onClose={() => setCalculated(null)} title="Aperçu bulletin de paie" size="lg">
        {calculated && <PayrollPreview calculated={calculated} onConfirm={d => createMut.mutate(d)} onClose={() => setCalculated(null)} />}
      </Modal>
      <PrintModal isOpen={!!printPayroll} onClose={() => setPrintPayroll(null)} title="Bulletin de Paie">
        {printPayroll && <BulletinDePaie payroll={printPayroll} />}
      </PrintModal>
    </div>
  );
}
