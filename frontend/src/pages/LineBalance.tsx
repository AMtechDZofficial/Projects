import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calculator, Play, Users, Clock, Zap, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { modelsApi, lineBalanceApi, machinesApi, employeesApi, productionApi } from '../services/api';
import type { CoutureModel, LineBalancingResult, OperatorAssignment, Machine, Employee, ProductionOrder } from '../types';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';

function UtilizationBar({ pct }: { pct: number }) {
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-400' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className="text-xs font-mono w-10 text-right">{pct.toFixed(0)}%</span>
    </div>
  );
}

const machineTypeLabel: Record<string, string> = {
  MACHINE_PLATE: 'Machine plate', SURJETEUSE: 'Surjeteuse',
  BOUTONNIERE: 'Boutonnière', MACHINE_BOUTON: 'M. bouton',
  TABLE_COUPE: 'T. coupe', FER_REPASSAGE: 'Fer', MACHINE_CANON: 'M. canon',
  BRODERIE: 'Broderie', POINT_INVISIBLE: 'Pt invisible', PRESSE: 'Presse', AUTRE: 'Autre'
};

function AssignmentForm({
  orderId, operationId, operationName, onSave, onClose
}: {
  orderId: string; operationId: string; operationName: string;
  onSave: (d: unknown) => void; onClose: () => void;
}) {
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-active'],
    queryFn: () => employeesApi.getAll().then(r => r.data as Employee[])
  });
  const { data: machines = [] } = useQuery({
    queryKey: ['machines-available'],
    queryFn: () => machinesApi.getAll({ status: 'DISPONIBLE' }).then(r => r.data as Machine[])
  });

  const [form, setForm] = useState({
    employeeId: '', machineId: '', targetQuantity: 0, shiftType: 'JOURNEE', notes: ''
  });
  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, orderId, operationId }); }} className="space-y-4">
      <div className="p-3 bg-primary-50 rounded-lg">
        <p className="text-sm font-medium text-primary-700">Poste: {operationName}</p>
      </div>
      <div>
        <label className="label">Opérateur *</label>
        <select className="input" value={form.employeeId} onChange={e => set('employeeId', e.target.value)} required>
          <option value="">— Sélectionner —</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.position})</option>)}
        </select>
      </div>
      <div>
        <label className="label">Machine (optionnel)</label>
        <select className="input" value={form.machineId} onChange={e => set('machineId', e.target.value)}>
          <option value="">— Aucune —</option>
          {machines.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Objectif (pièces/jour)</label>
          <input type="number" min="0" className="input" value={form.targetQuantity} onChange={e => set('targetQuantity', +e.target.value)} />
        </div>
        <div>
          <label className="label">Vacation</label>
          <select className="input" value={form.shiftType} onChange={e => set('shiftType', e.target.value)}>
            <option value="JOURNEE">Journée</option>
            <option value="MATIN">Matin</option>
            <option value="APRES_MIDI">Après-midi</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button type="submit" className="btn-primary">Affecter</button>
      </div>
    </form>
  );
}

export default function LineBalance() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [modelId, setModelId] = useState('');
  const [targetOutput, setTargetOutput] = useState(100);
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [efficiency, setEfficiency] = useState(80);
  const [result, setResult] = useState<LineBalancingResult | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [assignOp, setAssignOp] = useState<{ id: string; name: string } | null>(null);

  const { data: models = [] } = useQuery({
    queryKey: ['models'],
    queryFn: () => modelsApi.getAll().then(r => r.data as CoutureModel[])
  });

  const { data: activeOrders = [] } = useQuery({
    queryKey: ['orders-active'],
    queryFn: () => productionApi.getOrders({ status: 'EN_COURS' }).then(r => r.data as ProductionOrder[])
  });

  const { data: assignments = [], refetch: refetchAssignments } = useQuery({
    queryKey: ['assignments', selectedOrderId],
    queryFn: () => lineBalanceApi.getAssignments(selectedOrderId).then(r => r.data as OperatorAssignment[]),
    enabled: !!selectedOrderId
  });

  const calcMut = useMutation({
    mutationFn: () => lineBalanceApi.calculate({ modelId, targetOutput, hoursPerDay, efficiency }),
    onSuccess: (res) => setResult(res.data as LineBalancingResult)
  });

  const addAssignMut = useMutation({
    mutationFn: (d: unknown) => lineBalanceApi.createAssignment(d),
    onSuccess: () => { setAssignOp(null); refetchAssignments(); qc.invalidateQueries({ queryKey: ['assignments', selectedOrderId] }); }
  });

  const delAssignMut = useMutation({
    mutationFn: (id: string) => lineBalanceApi.deleteAssignment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments', selectedOrderId] })
  });

  const machineGroups = result ? result.stations.reduce((acc, s) => {
    if (s.machineType) {
      acc[s.machineType] = (acc[s.machineType] || 0) + s.requiredOperators;
    }
    return acc;
  }, {} as Record<string, number>) : {};

  return (
    <div className="space-y-5">
      {/* Calcul */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Calculator className="w-4 h-4" /> Équilibrage de ligne</h3>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="label">Modèle *</label>
            <select className="input" value={modelId} onChange={e => setModelId(e.target.value)}>
              <option value="">— Sélectionner —</option>
              {models.map(m => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Production cible (pièces/jour)</label>
            <input type="number" min="1" className="input" value={targetOutput} onChange={e => setTargetOutput(+e.target.value)} />
          </div>
          <div>
            <label className="label">Heures disponibles/jour</label>
            <input type="number" min="1" max="24" step="0.5" className="input" value={hoursPerDay} onChange={e => setHoursPerDay(+e.target.value)} />
          </div>
          <div>
            <label className="label">Efficacité (%)</label>
            <input type="number" min="10" max="100" className="input" value={efficiency} onChange={e => setEfficiency(+e.target.value)} />
          </div>
        </div>
        <button
          onClick={() => calcMut.mutate()}
          disabled={!modelId || calcMut.isPending}
          className="btn-primary"
        >
          <Play className="w-4 h-4" /> {calcMut.isPending ? 'Calcul...' : 'Calculer l\'équilibrage'}
        </button>
      </div>

      {result && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Temps de cycle', value: `${result.cycleTime.toFixed(2)} min`, icon: Clock, color: 'text-primary-600' },
              { label: 'Opérateurs total', value: result.totalOperators, icon: Users, color: 'text-blue-600' },
              { label: 'Efficacité ligne', value: `${result.lineEfficiency.toFixed(1)}%`, icon: Zap, color: result.lineEfficiency >= 75 ? 'text-green-600' : 'text-yellow-600' },
              { label: 'Goulot', value: result.bottleneckOperation, icon: AlertTriangle, color: 'text-red-600' }
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
                <p className={`text-lg font-bold truncate ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Besoins machines */}
          {Object.keys(machineGroups).length > 0 && (
            <div className="card p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Besoins en machines</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(machineGroups).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-purple-700">{machineTypeLabel[type] || type}</span>
                    <span className="bg-purple-200 text-purple-800 text-xs font-bold px-1.5 py-0.5 rounded-full">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Distribution par poste */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Distribution par poste — {result.model.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">Cycle time: {result.cycleTime.toFixed(2)} min | TMO total: {result.totalTMO.toFixed(1)} min</p>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-header">N°</th>
                  <th className="table-header">Opération</th>
                  <th className="table-header">Machine requise</th>
                  <th className="table-header text-right">TMO (min)</th>
                  <th className="table-header text-center">Opérateurs</th>
                  <th className="table-header w-48">Taux charge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {result.stations.map((s, i) => (
                  <tr key={s.operationId} className={`hover:bg-gray-50 ${s.bottleneck ? 'bg-red-50' : ''}`}>
                    <td className="table-cell text-gray-400 font-mono">{i + 1}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        {s.bottleneck && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                        <span className="font-medium">{s.operationName}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      {s.machineType ? <Badge variant="purple">{machineTypeLabel[s.machineType] || s.machineType}</Badge> : <span className="text-gray-400 text-xs">Manuel</span>}
                    </td>
                    <td className="table-cell text-right font-mono">{s.tmo.toFixed(2)}</td>
                    <td className="table-cell text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-primary-100 text-primary-700 font-bold rounded-full text-sm">
                        {s.requiredOperators}
                      </span>
                    </td>
                    <td className="table-cell"><UtilizationBar pct={s.utilization} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Affectations */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Users className="w-4 h-4" /> Affecter les opérateurs à un ordre</h3>
            <div className="flex items-center gap-3">
              <select className="input max-w-xs" value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)}>
                <option value="">— Sélectionner un ordre —</option>
                {activeOrders.map(o => (
                  <option key={o.id} value={o.id}>OF {o.orderNumber} — {o.model.name} ({o.quantity} pcs)</option>
                ))}
              </select>
            </div>

            {selectedOrderId && (
              <div className="space-y-3">
                {result.stations.map(s => {
                  const stationAssignments = assignments.filter(a => a.operationId === s.operationId);
                  return (
                    <div key={s.operationId} className="border border-gray-200 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-700">{s.operationName}</span>
                          <Badge variant="default">{s.requiredOperators} requis</Badge>
                          {stationAssignments.length >= s.requiredOperators && <Badge variant="success">Complet</Badge>}
                          {stationAssignments.length > 0 && stationAssignments.length < s.requiredOperators && <Badge variant="warning">{stationAssignments.length}/{s.requiredOperators}</Badge>}
                        </div>
                        {user?.role !== 'OPERATOR' && (
                          <button
                            onClick={() => setAssignOp({ id: s.operationId, name: s.operationName })}
                            className="text-primary-600 hover:text-primary-700 text-xs font-medium flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Affecter
                          </button>
                        )}
                      </div>
                      {stationAssignments.length > 0 && (
                        <div className="space-y-1">
                          {stationAssignments.map(a => (
                            <div key={a.id} className="flex items-center justify-between px-3 py-1.5 bg-gray-50 rounded-lg text-sm">
                              <span className="font-medium">{a.employee.firstName} {a.employee.lastName}</span>
                              <div className="flex items-center gap-3">
                                {a.machine && <span className="text-xs text-gray-500">{a.machine.name}</span>}
                                <span className="text-xs text-gray-400">{a.shiftType}</span>
                                {a.targetQuantity > 0 && <span className="text-xs text-primary-600">Obj: {a.targetQuantity} pcs</span>}
                                {user?.role !== 'OPERATOR' && (
                                  <button onClick={() => delAssignMut.mutate(a.id)} className="text-red-400 hover:text-red-600">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <Modal isOpen={!!assignOp} onClose={() => setAssignOp(null)} title="Affecter un opérateur">
        {assignOp && selectedOrderId && (
          <AssignmentForm
            orderId={selectedOrderId}
            operationId={assignOp.id}
            operationName={assignOp.name}
            onSave={d => addAssignMut.mutate(d)}
            onClose={() => setAssignOp(null)}
          />
        )}
      </Modal>
    </div>
  );
}
