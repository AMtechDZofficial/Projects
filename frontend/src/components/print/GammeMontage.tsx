import { useQuery } from '@tanstack/react-query';
import { modelsApi, costsApi } from '../../services/api';
import { CoutureModel, ModelCostResult } from '../../types';
import { format } from 'date-fns';

const PHASES = [
  { key: 'PREPARATION', label: '01 — PHASE PRÉPARATION', color: '#e8f4fd' },
  { key: 'ASSEMBLAGE', label: '02 — PHASE ASSEMBLAGE', color: '#e8fde8' },
  { key: 'FINITIONS', label: '03 — PHASE FINITIONS', color: '#fdf6e8' }
] as const;

interface Props {
  modelId: string;
  atelierName?: string;
}

export default function GammeMontage({ modelId, atelierName = 'ATELIER DE COUTURE' }: Props) {
  const { data: model } = useQuery<CoutureModel>({
    queryKey: ['model-full', modelId],
    queryFn: () => modelsApi.getFull(modelId).then(r => r.data)
  });

  const { data: cost } = useQuery<ModelCostResult>({
    queryKey: ['model-cost', modelId],
    queryFn: () => costsApi.getModelCost(modelId).then(r => r.data)
  });

  if (!model) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  const today = format(new Date(), 'dd/MM/yyyy');
  const ops = model.operations;
  const totalMins = ops.reduce((s, op) => s + Number(op.standardMinutes), 0);

  const opsByPhase = (phase: string) => ops.filter(op => (op.phase || 'ASSEMBLAGE') === phase);
  const phaseTime = (phase: string) => opsByPhase(phase).reduce((s, o) => s + Number(o.standardMinutes), 0);

  return (
    <div className="form-print-wrap">

      <div className="doc-header">
        <div className="doc-header-title">GAMME DE MONTAGE</div>
        <div className="doc-header-sub">
          <div className="doc-header-atelier">
            <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{atelierName}</div>
            <div style={{ fontSize: '8pt', color: '#555' }}>Bureau des Méthodes — Séquence d'Assemblage</div>
          </div>
          <div className="doc-header-ref">
            <div style={{ fontSize: '8pt' }}>Réf. doc: GM-{model.code}</div>
            <div style={{ fontSize: '8pt' }}>Date: {today}</div>
          </div>
        </div>
      </div>

      {/* Identification */}
      <div className="section-title">IDENTIFICATION</div>
      <table style={{ marginBottom: 6 }}>
        <tbody>
          <tr>
            <td style={{ width: '18%', fontWeight: 'bold', background: '#f0f0f0' }}>Référence</td>
            <td style={{ width: '32%' }}><strong>{model.code}</strong></td>
            <td style={{ width: '18%', fontWeight: 'bold', background: '#f0f0f0' }}>Catégorie</td>
            <td>{model.category}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Désignation</td>
            <td colSpan={3}><strong>{model.name}</strong></td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>TMO Total</td>
            <td><strong>{totalMins.toFixed(2)} min</strong></td>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Nb opérations</td>
            <td>{ops.length}</td>
          </tr>
        </tbody>
      </table>

      {/* Phases */}
      {PHASES.map(({ key, label, color }) => {
        const phaseOps = opsByPhase(key);
        const phaseMins = phaseTime(key);
        const pct = totalMins > 0 ? ((phaseMins / totalMins) * 100).toFixed(0) : '0';
        return (
          <div key={key}>
            <div className="section-title" style={{ background: color, border: `1px solid ${color.replace('e8', 'c0').replace('fd', 'd0')}`, marginTop: 6 }}>
              {label} &nbsp;—&nbsp; {phaseMins.toFixed(1)} min ({pct}%)
            </div>
            <table style={{ marginBottom: 4 }}>
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>Seq</th>
                  <th style={{ width: '26%' }}>Opération</th>
                  <th style={{ width: '15%' }}>Machine / Équip.</th>
                  <th style={{ width: '15%' }}>Type de point</th>
                  <th style={{ width: '9%' }}>TMO (min)</th>
                  <th style={{ width: '12%' }}>Coût MO (DZD)</th>
                  <th style={{ width: '18%' }}>Opérateur assigné</th>
                </tr>
              </thead>
              <tbody>
                {phaseOps.length > 0 ? phaseOps.map((op, i) => (
                  <tr key={op.id} className={i % 2 === 1 ? 'row-alt' : ''}>
                    <td style={{ textAlign: 'center' }}>{op.sequence}</td>
                    <td>{op.name}{op.description && <div style={{ fontSize: '7.5pt', color: '#666' }}>{op.description}</div>}</td>
                    <td style={{ fontSize: '9pt' }}>{op.machineType || '—'}</td>
                    <td style={{ fontSize: '9pt' }}>{op.stitchType || '—'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{Number(op.standardMinutes).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{cost ? (Number(op.standardMinutes) * cost.coutMinute).toFixed(2) : '—'}</td>
                    <td style={{ fontSize: '8pt' }}>___________________</td>
                  </tr>
                )) : (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} style={{ height: 18 }}>
                      <td /><td /><td /><td /><td /><td /><td />
                    </tr>
                  ))
                )}
                <tr style={{ background: '#e8e8e8', fontWeight: 'bold' }}>
                  <td colSpan={4} style={{ textAlign: 'right' }}>Sous-total {key.charAt(0) + key.slice(1).toLowerCase()}</td>
                  <td style={{ textAlign: 'center' }}>{phaseMins.toFixed(1)}</td>
                  <td style={{ textAlign: 'right' }}>{cost ? (phaseMins * cost.coutMinute).toFixed(2) : '—'}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Récapitulatif */}
      <div className="section-title">04 — RÉCAPITULATIF</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 6 }}>
        <div className="cost-summary">
          {PHASES.map(({ key, label, color }) => {
            const t = phaseTime(key);
            return (
              <div key={key} className="cost-row" style={{ background: color }}>
                <span>{key.charAt(0) + key.slice(1).toLowerCase()}</span>
                <span><strong>{t.toFixed(1)}</strong> min ({totalMins > 0 ? ((t / totalMins) * 100).toFixed(0) : 0}%)</span>
              </div>
            );
          })}
          <div className="cost-row-total">
            <span>TMO TOTAL</span>
            <span>{totalMins.toFixed(2)} min</span>
          </div>
        </div>
        <div className="cost-summary">
          <div className="cost-row"><span>Coût main-d'œuvre</span><span><strong>{cost ? Number(cost.laborCost).toFixed(2) : '—'}</strong> DZD</span></div>
          <div className="cost-row"><span>Coût minute</span><span><strong>{cost ? Number(cost.coutMinute).toFixed(4) : '—'}</strong> DZD/min</span></div>
          <div className="cost-row"><span>Nb opérations</span><span><strong>{ops.length}</strong></span></div>
        </div>
      </div>

      {/* Consignes */}
      <div className="section-title">05 — CONSIGNES GÉNÉRALES</div>
      <table style={{ marginBottom: 6 }}>
        <tbody>
          <tr style={{ height: 40 }}>
            <td style={{ verticalAlign: 'top', padding: '4px 8px', fontSize: '9pt' }}>
              {model.constructionNotes || <span style={{ color: '#bbb' }}>Aucune consigne spécifique enregistrée.</span>}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Signatures */}
      <div className="section-title">VALIDATION</div>
      <table>
        <tbody>
          <tr>
            {['Méthodes & Industrialisation', 'Chef de Ligne / Atelier', 'Contrôle Qualité'].map(label => (
              <td key={label} style={{ width: '33%', textAlign: 'center', padding: 8 }}>
                <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: 4 }}>{label}</div>
                <div className="sign-line" />
                <div style={{ fontSize: '8pt' }}>Nom & Visa — Date: ___________</div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 8, borderTop: '1px solid #ccc', paddingTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: '7.5pt', color: '#888' }}>
        <span>{atelierName} — Gamme de Montage {model.code}</span>
        <span>Imprimé le {today}</span>
        <span>Page 1/1</span>
      </div>
    </div>
  );
}
