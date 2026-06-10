import { useQuery } from '@tanstack/react-query';
import { modelsApi } from '../../services/api';
import { CoutureModel, PatternPiece } from '../../types';
import { format } from 'date-fns';

const FABRIC_TYPE_LABEL: Record<string, string> = {
  PRINCIPAL: 'Tissu Principal',
  DOUBLURE: 'Doublure',
  ENTOILAGE: 'Entoilage',
  THERMOCOLLANT: 'Thermocollant',
  AUTRE: 'Autre'
};

const GRAIN_LABEL: Record<string, string> = {
  DROIT_FIL: 'Droit-fil →',
  BIAIS: 'Biais ↗',
  SANS_CONTRAINTE: 'Sans contrainte'
};

interface Props {
  modelId: string;
  atelierName?: string;
}

export default function NomenclatureBOM({ modelId, atelierName = 'ATELIER DE COUTURE' }: Props) {
  const { data: model } = useQuery<CoutureModel>({
    queryKey: ['model-full', modelId],
    queryFn: () => modelsApi.getFull(modelId).then(r => r.data)
  });

  const pieces: PatternPiece[] = model?.patternPieces || [];

  if (!model) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  const today = format(new Date(), 'dd/MM/yyyy');
  const groups = ['PRINCIPAL', 'DOUBLURE', 'ENTOILAGE', 'THERMOCOLLANT', 'AUTRE'];

  return (
    <div className="form-print-wrap">

      <div className="doc-header">
        <div className="doc-header-title">NOMENCLATURE — B.O.M.</div>
        <div className="doc-header-sub">
          <div className="doc-header-atelier">
            <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{atelierName}</div>
            <div style={{ fontSize: '8pt', color: '#555' }}>Bureau des Méthodes — Patronage</div>
          </div>
          <div className="doc-header-ref">
            <div style={{ fontSize: '8pt' }}>Réf. doc: BOM-{model.code}</div>
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
        </tbody>
      </table>

      {groups.map(group => {
        const groupPieces = pieces.filter(p => p.fabricType === group);
        if (groupPieces.length === 0) return null;
        return (
          <div key={group}>
            <div className="section-title" style={{ marginTop: 6 }}>
              {FABRIC_TYPE_LABEL[group] || group}
            </div>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>N°</th>
                  <th style={{ width: '28%' }}>Pièce de Patron</th>
                  <th style={{ width: '15%' }}>Dimensions</th>
                  <th style={{ width: '18%' }}>Sens du Fil</th>
                  <th style={{ width: '8%' }}>Qté</th>
                  <th style={{ width: '12%' }}>M.C. (cm)</th>
                  <th style={{ width: '14%' }}>Observations</th>
                </tr>
              </thead>
              <tbody>
                {groupPieces.map((p, i) => (
                  <tr key={p.id} className={i % 2 === 1 ? 'row-alt' : ''}>
                    <td style={{ textAlign: 'center' }}>{p.sequence || i + 1}</td>
                    <td style={{ fontWeight: 'bold' }}>{p.pieceName}</td>
                    <td style={{ textAlign: 'center', fontSize: '9pt' }}>{p.dimensions || '—'}</td>
                    <td style={{ fontSize: '9pt' }}>{p.grainLine ? (GRAIN_LABEL[p.grainLine] || p.grainLine) : '—'}</td>
                    <td style={{ textAlign: 'center' }}>{p.quantity}</td>
                    <td style={{ textAlign: 'center' }}>{p.seamAllowance != null ? Number(p.seamAllowance).toFixed(1) : '—'}</td>
                    <td style={{ fontSize: '8pt' }}>{p.notes || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {pieces.length === 0 && (
        <div className="section-title">02 — LISTE DES PIÈCES DE PATRON</div>
      )}
      {pieces.length === 0 && (
        <table>
          <thead>
            <tr>
              <th style={{ width: '5%' }}>N°</th>
              <th style={{ width: '25%' }}>Pièce de Patron</th>
              <th style={{ width: '15%' }}>Type Tissu</th>
              <th style={{ width: '15%' }}>Dimensions</th>
              <th style={{ width: '15%' }}>Sens du Fil</th>
              <th style={{ width: '8%' }}>Qté</th>
              <th style={{ width: '10%' }}>M.C. (cm)</th>
              <th style={{ width: '7%' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(12)].map((_, i) => (
              <tr key={i} style={{ height: 18 }}>
                <td style={{ textAlign: 'center' }}>{i + 1}</td>
                <td /><td /><td /><td /><td /><td /><td />
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Récapitulatif */}
      {pieces.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 8 }}>RÉCAPITULATIF</div>
          <table style={{ marginBottom: 6 }}>
            <tbody>
              {groups.map(g => {
                const n = pieces.filter(p => p.fabricType === g).length;
                return n > 0 ? (
                  <tr key={g}>
                    <td style={{ width: '40%', fontWeight: 'bold', background: '#f0f0f0' }}>{FABRIC_TYPE_LABEL[g]}</td>
                    <td>{n} pièce{n > 1 ? 's' : ''}</td>
                    <td style={{ width: '40%', fontWeight: 'bold', background: '#f0f0f0' }}>Total pièces all types</td>
                    <td><strong>{pieces.length}</strong></td>
                  </tr>
                ) : null;
              })}
            </tbody>
          </table>
        </>
      )}

      {/* Signatures */}
      <div className="section-title">VALIDATION</div>
      <table>
        <tbody>
          <tr>
            {['Patronnier / Modéliste', 'Chef Bureau des Méthodes', 'Directeur Technique'].map(label => (
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
        <span>{atelierName} — BOM {model.code}</span>
        <span>Imprimé le {today}</span>
        <span>Page 1/1</span>
      </div>
    </div>
  );
}
