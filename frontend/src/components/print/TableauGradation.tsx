import { useQuery } from '@tanstack/react-query';
import { modelsApi } from '../../services/api';
import { CoutureModel, GradationRow } from '../../types';
import { format } from 'date-fns';

const SIZES = ['xs', 's', 'm', 'l', 'xl', 'xxl'] as const;
const SIZE_LABELS = ['XS / 36', 'S / 38', 'M / 40', 'L / 42', 'XL / 44', 'XXL / 46'];

interface Props {
  modelId: string;
  atelierName?: string;
}

function diff(a?: number, b?: number): string {
  if (a == null || b == null) return '—';
  const d = Number(a) - Number(b);
  return d > 0 ? `+${d.toFixed(1)}` : d.toFixed(1);
}

export default function TableauGradation({ modelId, atelierName = 'ATELIER DE COUTURE' }: Props) {
  const { data: model } = useQuery<CoutureModel>({
    queryKey: ['model-full', modelId],
    queryFn: () => modelsApi.getFull(modelId).then(r => r.data)
  });

  const rows: GradationRow[] = model?.gradationRows || [];

  if (!model) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  const today = format(new Date(), 'dd/MM/yyyy');

  const defaultRows = [
    'Tour de poitrine', 'Tour de taille', 'Tour de hanches',
    'Longueur dos', 'Longueur devant', 'Longueur manches',
    'Largeur épaules', 'Carrure dos', 'Carrure devant',
    'Encolure', 'Tour de bras', 'Tour de poignet',
    'Entrejambe', 'Longueur totale'
  ];

  const displayRows: Array<{ measurement: string; xs?: number; s?: number; m?: number; l?: number; xl?: number; xxl?: number; unit: string; id?: string }> =
    rows.length > 0 ? rows : defaultRows.map(m => ({ measurement: m, unit: 'cm' }));

  return (
    <div className="form-print-wrap">

      <div className="doc-header">
        <div className="doc-header-title">TABLEAU DE GRADATION</div>
        <div className="doc-header-sub">
          <div className="doc-header-atelier">
            <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{atelierName}</div>
            <div style={{ fontSize: '8pt', color: '#555' }}>Bureau des Méthodes — Patronage & Gradation</div>
          </div>
          <div className="doc-header-ref">
            <div style={{ fontSize: '8pt' }}>Réf. doc: GRAD-{model.code}</div>
            <div style={{ fontSize: '8pt' }}>Date: {today}</div>
          </div>
        </div>
      </div>

      <div className="section-title">01 — IDENTIFICATION</div>
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
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Taille de base</td>
            <td>M / 40</td>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Gamme de tailles</td>
            <td>XS/36 → XXL/46</td>
          </tr>
        </tbody>
      </table>

      {/* Table principale */}
      <div className="section-title">02 — TABLE DES MENSURATIONS PAR TAILLE</div>
      <table style={{ marginBottom: 6 }}>
        <thead>
          <tr>
            <th style={{ width: '22%' }}>Mensuration</th>
            {SIZE_LABELS.map(s => <th key={s} style={{ width: '11%', textAlign: 'center' }}>{s}</th>)}
            <th style={{ width: '5%', textAlign: 'center' }}>Unité</th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, i) => (
            <tr key={row.id || i} className={i % 2 === 1 ? 'row-alt' : ''}>
              <td style={{ fontWeight: i < rows.length ? 'normal' : 'normal' }}>{row.measurement}</td>
              {SIZES.map(s => (
                <td key={s} style={{ textAlign: 'center' }}>
                  {row[s] != null ? Number(row[s]).toFixed(1) : <span style={{ color: '#bbb' }}>—</span>}
                </td>
              ))}
              <td style={{ textAlign: 'center', fontSize: '8pt' }}>{row.unit || 'cm'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Écarts inter-tailles */}
      {rows.length > 0 && (
        <>
          <div className="section-title">03 — ÉCARTS INTER-TAILLES (Δ)</div>
          <table style={{ marginBottom: 6 }}>
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Mensuration</th>
                <th style={{ width: '14%', textAlign: 'center' }}>XS→S</th>
                <th style={{ width: '14%', textAlign: 'center' }}>S→M</th>
                <th style={{ width: '14%', textAlign: 'center' }}>M→L</th>
                <th style={{ width: '14%', textAlign: 'center' }}>L→XL</th>
                <th style={{ width: '14%', textAlign: 'center' }}>XL→XXL</th>
                <th style={{ width: '8%', textAlign: 'center' }}>Unité</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} className={i % 2 === 1 ? 'row-alt' : ''}>
                  <td>{row.measurement}</td>
                  <td style={{ textAlign: 'center', fontSize: '9pt' }}>{diff(row.s, row.xs)}</td>
                  <td style={{ textAlign: 'center', fontSize: '9pt' }}>{diff(row.m, row.s)}</td>
                  <td style={{ textAlign: 'center', fontSize: '9pt' }}>{diff(row.l, row.m)}</td>
                  <td style={{ textAlign: 'center', fontSize: '9pt' }}>{diff(row.xl, row.l)}</td>
                  <td style={{ textAlign: 'center', fontSize: '9pt' }}>{diff(row.xxl, row.xl)}</td>
                  <td style={{ textAlign: 'center', fontSize: '8pt' }}>{row.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Points de gradation */}
      <div className="section-title">{rows.length > 0 ? '04' : '03'} — POINTS DE GRADATION & RÈGLES D'ÉCART</div>
      <table style={{ marginBottom: 6 }}>
        <thead>
          <tr>
            <th style={{ width: '25%' }}>Zone du vêtement</th>
            <th style={{ width: '25%' }}>Point de gradation</th>
            <th style={{ width: '25%' }}>Règle d'écart appliquée</th>
            <th style={{ width: '25%' }}>Observations</th>
          </tr>
        </thead>
        <tbody>
          {['Encolure / Col', 'Épaule', 'Poitrine / Côtés', 'Taille', 'Hanches', 'Manche / Emmanchure', 'Ourlet / Bas'].map((zone, i) => (
            <tr key={zone} style={{ height: 16 }} className={i % 2 === 1 ? 'row-alt' : ''}>
              <td style={{ fontSize: '9pt' }}>{zone}</td>
              <td /><td /><td />
            </tr>
          ))}
        </tbody>
      </table>

      {/* Validation */}
      <div className="section-title">VALIDATION</div>
      <table>
        <tbody>
          <tr>
            {['Patronnier / Modéliste', 'Responsable Gradation', 'Directeur Technique'].map(label => (
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
        <span>{atelierName} — Gradation {model.code}</span>
        <span>Imprimé le {today}</span>
        <span>Page 1/1</span>
      </div>
    </div>
  );
}
