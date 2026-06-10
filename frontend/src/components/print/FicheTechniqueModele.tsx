import { useQuery } from '@tanstack/react-query';
import { modelsApi, costsApi } from '../../services/api';
import { CoutureModel, ModelCostResult } from '../../types';
import { format } from 'date-fns';

const FABRIC_CATS = new Set(['TISSU', 'DOUBLURE', 'ENTOILAGE']);

interface Props {
  modelId: string;
  atelierName?: string;
}

export default function FicheTechniqueModele({ modelId, atelierName = 'ATELIER DE COUTURE' }: Props) {
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
  const totalMins = model.operations.reduce((s, op) => s + Number(op.standardMinutes), 0);
  const tissus = model.components.filter(c => FABRIC_CATS.has(c.material.category));
  const mercerie = model.components.filter(c => !FABRIC_CATS.has(c.material.category));

  const emptyRows = (n: number, count: number) =>
    count < n ? [...Array(n - count)].map((_, i) => (
      <tr key={`e${i}`} style={{ height: 18 }}>
        <td style={{ textAlign: 'center' }}>{count + i + 1}</td>
        <td /><td /><td /><td /><td /><td />
      </tr>
    )) : null;

  return (
    <div className="form-print-wrap">

      {/* En-tête */}
      <div className="doc-header">
        <div className="doc-header-title">FICHE TECHNIQUE MODÈLE</div>
        <div className="doc-header-sub">
          <div className="doc-header-atelier">
            <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{atelierName}</div>
            <div style={{ fontSize: '8pt', color: '#555' }}>Département : Bureau des Méthodes</div>
          </div>
          <div className="doc-header-ref">
            <div style={{ fontSize: '8pt' }}>Réf. doc: FT-{model.code}</div>
            <div style={{ fontSize: '8pt' }}>Édition: 1</div>
            <div style={{ fontSize: '8pt' }}>Date: {today}</div>
          </div>
        </div>
      </div>

      {/* 01 Identification */}
      <div className="section-title">01 — IDENTIFICATION DU MODÈLE</div>
      <table style={{ marginBottom: 6 }}>
        <tbody>
          <tr>
            <td style={{ width: '18%', fontWeight: 'bold', background: '#f0f0f0' }}>Référence</td>
            <td style={{ width: '32%' }}><strong>{model.code}</strong></td>
            <td style={{ width: '18%', fontWeight: 'bold', background: '#f0f0f0' }}>Catégorie</td>
            <td style={{ width: '32%' }}>{model.category}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Désignation</td>
            <td colSpan={3}><strong>{model.name}</strong></td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Description</td>
            <td colSpan={3} style={{ minHeight: 28 }}>{model.description || ' '}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Prix de vente</td>
            <td>{model.salePrice ? `${Number(model.salePrice).toLocaleString('fr-DZ')} DZD` : '—'}</td>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Statut</td>
            <td>Actif</td>
          </tr>
        </tbody>
      </table>

      {/* 02 Croquis face / dos */}
      <div className="section-title">02 — CROQUIS TECHNIQUE</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 6 }}>
        <div className="sketch-zone" style={{ minHeight: 110, textAlign: 'center', paddingTop: 40, fontSize: '8pt', color: '#aaa' }}>
          VUE DE FACE
        </div>
        <div className="sketch-zone" style={{ minHeight: 110, textAlign: 'center', paddingTop: 40, fontSize: '8pt', color: '#aaa' }}>
          VUE DE DOS
        </div>
      </div>

      {/* 03 Tissus & Doublures */}
      <div className="section-title">03 — TISSUS, DOUBLURES & ENTOILAGES</div>
      <table>
        <thead>
          <tr>
            <th style={{ width: '5%' }}>N°</th>
            <th style={{ width: '28%' }}>Désignation</th>
            <th style={{ width: '10%' }}>Code</th>
            <th style={{ width: '10%' }}>Catég.</th>
            <th style={{ width: '9%' }}>Unité</th>
            <th style={{ width: '10%' }}>Qté/pce</th>
            <th style={{ width: '14%' }}>P.U. (DZD)</th>
            <th style={{ width: '14%' }}>Montant</th>
          </tr>
        </thead>
        <tbody>
          {tissus.map((c, i) => (
            <tr key={c.id} className={i % 2 === 1 ? 'row-alt' : ''}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td>{c.material.name}</td>
              <td style={{ textAlign: 'center', fontSize: '8pt' }}>{c.material.code}</td>
              <td style={{ fontSize: '8pt' }}>{c.material.category}</td>
              <td style={{ textAlign: 'center' }}>{c.material.unit}</td>
              <td style={{ textAlign: 'right' }}>{Number(c.quantity).toFixed(3)}</td>
              <td style={{ textAlign: 'right' }}>{Number(c.material.unitCost).toLocaleString('fr-DZ')}</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{(Number(c.quantity) * Number(c.material.unitCost)).toFixed(2)}</td>
            </tr>
          ))}
          {emptyRows(4, tissus.length)}
        </tbody>
      </table>

      {/* 04 Fournitures & Mercerie */}
      <div className="section-title">04 — FOURNITURES & MERCERIE</div>
      <table>
        <thead>
          <tr>
            <th style={{ width: '5%' }}>N°</th>
            <th style={{ width: '28%' }}>Désignation</th>
            <th style={{ width: '10%' }}>Code</th>
            <th style={{ width: '10%' }}>Catég.</th>
            <th style={{ width: '9%' }}>Unité</th>
            <th style={{ width: '10%' }}>Qté/pce</th>
            <th style={{ width: '14%' }}>P.U. (DZD)</th>
            <th style={{ width: '14%' }}>Montant</th>
          </tr>
        </thead>
        <tbody>
          {mercerie.map((c, i) => (
            <tr key={c.id} className={i % 2 === 1 ? 'row-alt' : ''}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td>{c.material.name}</td>
              <td style={{ textAlign: 'center', fontSize: '8pt' }}>{c.material.code}</td>
              <td style={{ fontSize: '8pt' }}>{c.material.category}</td>
              <td style={{ textAlign: 'center' }}>{c.material.unit}</td>
              <td style={{ textAlign: 'right' }}>{Number(c.quantity).toFixed(3)}</td>
              <td style={{ textAlign: 'right' }}>{Number(c.material.unitCost).toLocaleString('fr-DZ')}</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{(Number(c.quantity) * Number(c.material.unitCost)).toFixed(2)}</td>
            </tr>
          ))}
          {emptyRows(3, mercerie.length)}
          <tr style={{ background: '#e8e8e8', fontWeight: 'bold' }}>
            <td colSpan={7} style={{ textAlign: 'right' }}>TOTAL MATIÈRES</td>
            <td style={{ textAlign: 'right' }}>{cost ? Number(cost.materialsCost).toFixed(2) : '—'}</td>
          </tr>
        </tbody>
      </table>

      {/* 05 Instructions de construction */}
      <div className="section-title">05 — INSTRUCTIONS DE CONSTRUCTION</div>
      <table style={{ marginBottom: 6 }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'top', padding: '6px 8px', minHeight: 60, whiteSpace: 'pre-wrap', fontSize: '9pt' }}>
              {model.constructionNotes || ' \n\n\n\n'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 06 Entretien & Étiquetage */}
      <div className="section-title">06 — CONSEILS D'ENTRETIEN & ÉTIQUETAGE</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 6 }}>
        <table>
          <thead><tr><th colSpan={2}>Conseils d'entretien</th></tr></thead>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'top', padding: '6px 8px', minHeight: 50, whiteSpace: 'pre-wrap', fontSize: '9pt' }}>
                {model.careInstructions || ' \n\n\n'}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', background: '#f0f0f0', width: '40%', fontSize: '8pt' }}>Symboles soin :</td>
              <td style={{ letterSpacing: 4, fontSize: '12pt' }}>⊟ ⊠ ○ △ ◻</td>
            </tr>
          </tbody>
        </table>
        <table>
          <thead><tr><th colSpan={2}>Informations étiquetage</th></tr></thead>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'top', padding: '6px 8px', minHeight: 50, whiteSpace: 'pre-wrap', fontSize: '9pt' }}>
                {model.labelInfo || ' \n\n\n'}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', background: '#f0f0f0', width: '45%', fontSize: '8pt' }}>Composition tissu :</td>
              <td style={{ fontSize: '9pt' }}>________ %</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 07 Récapitulatif coûts */}
      <div className="section-title">07 — RÉCAPITULATIF DES COÛTS</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div className="cost-summary">
          <div className="cost-row"><span>Coût matières premières</span><span><strong>{cost ? Number(cost.materialsCost).toFixed(2) : '—'}</strong> DZD</span></div>
          <div className="cost-row"><span>Main d'œuvre directe</span><span><strong>{cost ? Number(cost.laborCost).toFixed(2) : '—'}</strong> DZD</span></div>
          <div className="cost-row"><span>Frais généraux (overhead)</span><span><strong>{cost ? Number(cost.overheadCost).toFixed(2) : '—'}</strong> DZD</span></div>
          <div className="cost-row-total"><span>COÛT DE REVIENT</span><span>{cost ? Number(cost.totalCost).toFixed(2) : '—'} DZD</span></div>
        </div>
        <div className="cost-summary">
          <div className="cost-row"><span>Prix de vente HT</span><span><strong>{model.salePrice ? Number(model.salePrice).toFixed(2) : '—'}</strong> DZD</span></div>
          <div className="cost-row"><span>Marge brute</span><span><strong>{cost && model.salePrice ? (Number(model.salePrice) - cost.totalCost).toFixed(2) : '—'}</strong> DZD</span></div>
          <div className="cost-row"><span>Taux de marge</span><span><strong>{cost && model.salePrice && cost.totalCost > 0 ? (((Number(model.salePrice) - cost.totalCost) / Number(model.salePrice)) * 100).toFixed(1) : '—'}</strong> %</span></div>
          <div className="cost-row"><span>TMO total</span><span><strong>{totalMins.toFixed(1)}</strong> min — Coût/min: <strong>{cost ? Number(cost.coutMinute).toFixed(4) : '—'}</strong></span></div>
        </div>
      </div>

      {/* 08 Validation */}
      <div className="section-title">08 — VALIDATION</div>
      <table>
        <tbody>
          <tr>
            {['Établi par (Bureau des Méthodes)', 'Vérifié par (Chef Atelier)', 'Approuvé par (Directeur)'].map(label => (
              <td key={label} style={{ width: '33%', textAlign: 'center', padding: 8 }}>
                <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: 4 }}>{label}</div>
                <div className="sign-line" />
                <div style={{ fontSize: '8pt' }}>Nom & Visa</div>
                <div style={{ fontSize: '8pt', marginTop: 4 }}>Date: ___________</div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 8, borderTop: '1px solid #ccc', paddingTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: '7.5pt', color: '#888' }}>
        <span>{atelierName} — Fiche Technique {model.code}</span>
        <span>Imprimé le {today} — Document interne confidentiel</span>
        <span>Page 1/1</span>
      </div>
    </div>
  );
}
