import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ShieldCheck, AlertTriangle, CheckCircle, XCircle, BarChart2 } from 'lucide-react';
import { qualityApi, productionApi } from '../services/api';
import type { DefectType, QualityCheck, ProductionOrder } from '../types';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { format } from 'date-fns';

const severityConfig = {
  MINEUR: { label: 'Mineur', badge: 'warning' as const },
  MAJEUR: { label: 'Majeur', badge: 'danger' as const },
  CRITIQUE: { label: 'Critique', badge: 'danger' as const }
};

const qcStatusConfig: Record<string, { label: string; badge: 'info' | 'success' | 'danger' | 'warning' | 'default' }> = {
  EN_ATTENTE: { label: 'En attente', badge: 'default' },
  EN_COURS: { label: 'En cours', badge: 'info' },
  VALIDE: { label: 'Validé', badge: 'success' },
  BLOQUE: { label: 'Bloqué', badge: 'danger' }
};

function DefectTypeForm({ onSave, onClose }: { onSave: (d: unknown) => void; onClose: () => void }) {
  const [form, setForm] = useState({ code: '', name: '', severity: 'MINEUR', description: '' });
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Code *</label>
          <input className="input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required placeholder="EX: DEF-001" />
        </div>
        <div>
          <label className="label">Sévérité</label>
          <select className="input" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
            <option value="MINEUR">Mineur</option>
            <option value="MAJEUR">Majeur</option>
            <option value="CRITIQUE">Critique</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Nom du défaut *</label>
        <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Ex: Couture mal alignée" />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button type="submit" className="btn-primary"><Plus className="w-4 h-4" /> Créer</button>
      </div>
    </form>
  );
}

function QCForm({ onSave, onClose }: { onSave: (d: unknown) => void; onClose: () => void }) {
  const { data: orders = [] } = useQuery({
    queryKey: ['production-orders'],
    queryFn: () => productionApi.getOrders().then(r => r.data as ProductionOrder[])
  });
  const { data: defectTypes = [] } = useQuery({
    queryKey: ['defect-types'],
    queryFn: () => qualityApi.getDefectTypes().then(r => r.data as DefectType[])
  });

  const [form, setForm] = useState({
    orderId: '',
    checkType: 'EN_COURS',
    checkDate: format(new Date(), 'yyyy-MM-dd'),
    quantityChecked: 0,
    quantityPassed: 0,
    quantityRework: 0,
    quantityRejected: 0,
    notes: ''
  });
  const [defects, setDefects] = useState<{ defectTypeId: string; count: number; notes: string }[]>([]);

  const addDefect = () => setDefects(d => [...d, { defectTypeId: '', count: 1, notes: '' }]);
  const setDefect = (i: number, k: string, v: unknown) => setDefects(d => d.map((item, idx) => idx === i ? { ...item, [k]: v } : item));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, defects: defects.filter(d => d.defectTypeId) }); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Ordre de fabrication *</label>
          <select className="input" value={form.orderId} onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))} required>
            <option value="">— Sélectionner —</option>
            {orders.map(o => <option key={o.id} value={o.id}>{o.orderNumber} — {o.model.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Type de contrôle</label>
          <select className="input" value={form.checkType} onChange={e => setForm(f => ({ ...f, checkType: e.target.value }))}>
            <option value="EN_COURS">En cours</option>
            <option value="FINAL">Final</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Contrôlés', key: 'quantityChecked' },
          { label: 'Passés', key: 'quantityPassed' },
          { label: 'Retouches', key: 'quantityRework' },
          { label: 'Rejetés', key: 'quantityRejected' }
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="label text-xs">{label}</label>
            <input type="number" min="0" className="input" value={(form as Record<string, unknown>)[key] as number}
              onChange={e => setForm(f => ({ ...f, [key]: +e.target.value }))} />
          </div>
        ))}
      </div>
      {form.quantityChecked > 0 && (
        <div className="p-3 bg-primary-50 rounded-xl text-sm flex gap-4">
          <span>TQP: <strong>{((form.quantityPassed / form.quantityChecked) * 100).toFixed(1)}%</strong></span>
          <span className="text-gray-500">Auto-statut: {(form.quantityPassed / form.quantityChecked) >= 0.95 ? '✅ VALIDÉ' : (form.quantityPassed / form.quantityChecked) < 0.7 ? '🔴 BLOQUÉ' : '⚠️ EN COURS'}</span>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Défauts constatés</label>
          <button type="button" onClick={addDefect} className="text-primary-600 text-xs font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Ajouter</button>
        </div>
        {defects.map((d, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <select className="input flex-1" value={d.defectTypeId} onChange={e => setDefect(i, 'defectTypeId', e.target.value)}>
              <option value="">— Type de défaut —</option>
              {defectTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.code} — {dt.name}</option>)}
            </select>
            <input type="number" min="1" className="input w-20" value={d.count} onChange={e => setDefect(i, 'count', +e.target.value)} placeholder="Nb" />
          </div>
        ))}
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button type="submit" className="btn-primary"><ShieldCheck className="w-4 h-4" /> Enregistrer</button>
      </div>
    </form>
  );
}

export default function Quality() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'checks' | 'defects'>('checks');
  const [showQCForm, setShowQCForm] = useState(false);
  const [showDefectForm, setShowDefectForm] = useState(false);

  const { data: checks = [], isLoading } = useQuery({
    queryKey: ['quality-checks'],
    queryFn: () => qualityApi.getChecks().then(r => r.data as QualityCheck[])
  });

  const { data: defectTypes = [] } = useQuery({
    queryKey: ['defect-types'],
    queryFn: () => qualityApi.getDefectTypes().then(r => r.data as DefectType[])
  });

  const createCheckMut = useMutation({
    mutationFn: (d: unknown) => qualityApi.createCheck(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quality-checks'] }); setShowQCForm(false); }
  });

  const createDefectMut = useMutation({
    mutationFn: (d: unknown) => qualityApi.createDefectType(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['defect-types'] }); setShowDefectForm(false); }
  });

  const validated = checks.filter(c => c.status === 'VALIDE').length;
  const blocked = checks.filter(c => c.status === 'BLOQUE').length;
  const avgFPY = checks.length
    ? checks.reduce((s, c) => s + Number(c.firstPassYield), 0) / checks.length
    : 0;
  const totalChecked = checks.reduce((s, c) => s + c.quantityChecked, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Contrôles total', value: checks.length, color: 'text-gray-700' },
          { label: 'Validés', value: validated, color: 'text-green-600' },
          { label: 'Bloqués', value: blocked, color: 'text-red-600' },
          { label: 'TQP moyen', value: `${avgFPY.toFixed(1)}%`, color: avgFPY >= 95 ? 'text-green-600' : avgFPY >= 70 ? 'text-orange-500' : 'text-red-600' }
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {([['checks', 'Contrôles qualité'], ['defects', 'Catalogue défauts']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => tab === 'checks' ? setShowQCForm(true) : setShowDefectForm(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          {tab === 'checks' ? 'Nouveau contrôle' : 'Nouveau défaut'}
        </button>
      </div>

      {tab === 'checks' && (
        <div className="card overflow-hidden">
          {isLoading ? <div className="p-8 text-center text-gray-400">Chargement...</div> :
            checks.length === 0 ? (
              <div className="p-12 text-center">
                <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun contrôle qualité enregistré</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="table-header">Date</th>
                    <th className="table-header">Ordre</th>
                    <th className="table-header">Type</th>
                    <th className="table-header text-right">Contrôlés</th>
                    <th className="table-header text-right">Passés</th>
                    <th className="table-header text-right">Retouches</th>
                    <th className="table-header text-right">Rejetés</th>
                    <th className="table-header text-right">TQP</th>
                    <th className="table-header">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {checks.map(c => {
                    const fpy = Number(c.firstPassYield);
                    return (
                      <tr key={c.id} className={`hover:bg-gray-50 ${c.status === 'BLOQUE' ? 'bg-red-50' : ''}`}>
                        <td className="table-cell text-sm">{format(new Date(c.checkDate), 'dd/MM/yyyy')}</td>
                        <td className="table-cell font-mono text-sm text-gray-600">{c.order?.orderNumber || '—'}</td>
                        <td className="table-cell">
                          <Badge variant={c.checkType === 'FINAL' ? 'info' : 'default'}>
                            {c.checkType === 'FINAL' ? 'Final' : 'Intermédiaire'}
                          </Badge>
                        </td>
                        <td className="table-cell text-right">{c.quantityChecked}</td>
                        <td className="table-cell text-right text-green-600 font-medium">{c.quantityPassed}</td>
                        <td className="table-cell text-right text-orange-500">{c.quantityRework}</td>
                        <td className="table-cell text-right text-red-500">{c.quantityRejected}</td>
                        <td className="table-cell text-right">
                          <span className={`font-bold ${fpy >= 95 ? 'text-green-600' : fpy >= 70 ? 'text-orange-500' : 'text-red-600'}`}>
                            {fpy.toFixed(1)}%
                          </span>
                        </td>
                        <td className="table-cell">
                          <Badge variant={qcStatusConfig[c.status].badge}>{qcStatusConfig[c.status].label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          }
        </div>
      )}

      {tab === 'defects' && (
        <div className="card overflow-hidden">
          {defectTypes.length === 0 ? (
            <div className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun type de défaut configuré</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-header">Code</th>
                  <th className="table-header">Nom</th>
                  <th className="table-header">Sévérité</th>
                  <th className="table-header">Description</th>
                  <th className="table-header">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {defectTypes.map(dt => (
                  <tr key={dt.id} className="hover:bg-gray-50">
                    <td className="table-cell font-mono font-semibold text-gray-600">{dt.code}</td>
                    <td className="table-cell font-medium">{dt.name}</td>
                    <td className="table-cell">
                      <Badge variant={severityConfig[dt.severity].badge}>{severityConfig[dt.severity].label}</Badge>
                    </td>
                    <td className="table-cell text-sm text-gray-500">{dt.description || '—'}</td>
                    <td className="table-cell">
                      {dt.isActive
                        ? <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle className="w-3.5 h-3.5" /> Actif</span>
                        : <span className="flex items-center gap-1 text-gray-400 text-xs"><XCircle className="w-3.5 h-3.5" /> Inactif</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal isOpen={showQCForm} onClose={() => setShowQCForm(false)} title="Nouveau contrôle qualité" size="lg">
        <QCForm onSave={d => createCheckMut.mutate(d)} onClose={() => setShowQCForm(false)} />
      </Modal>
      <Modal isOpen={showDefectForm} onClose={() => setShowDefectForm(false)} title="Nouveau type de défaut">
        <DefectTypeForm onSave={d => createDefectMut.mutate(d)} onClose={() => setShowDefectForm(false)} />
      </Modal>
    </div>
  );
}
