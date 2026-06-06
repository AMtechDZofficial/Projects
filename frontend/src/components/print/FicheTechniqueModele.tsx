import { useQuery } from '@tanstack/react-query';
import { modelsApi, costsApi } from '../../services/api';
import { CoutureModel, ModelCostResult } from '../../types';
import { format } from 'date-fns';

interface Props {
  modelId: string;
  atelierName?: string;
}

export default function FicheTechniqueModele({ modelId, atelierName = 'ATELIER DE COUTURE' }: Props) {
  const { data: model } = useQuery<CoutureModel>({
    queryKey: ['model-detail', modelId],
    queryFn: () => modelsApi.getOne(modelId).then(r => r.data)
  });

  const { data: cost } = useQuery<ModelCostResult>({
    queryKey: ['model-cost', modelId],
    queryFn: () => costsApi.getModelCost(modelId).then(r => r.data)
  });

  if (!model) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  const today = format(new Date(), 'dd/MM/yyyy');
  const totalMins = model.operations.reduce((s, op) => s + Number(op.standardMinutes), 0);

  return (
    <div className="form-print-wrap">

      {/* En-tête document */}
      <div className="doc-header">
        <div className="doc-header-title">FICHE TECHNIQUE MODÈLE</div>
        <div className="doc-header-sub">
          <div className="doc-header-atelier">
            <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{atelierName}</div>
            <div style={{ fontSize: '8pt', color: '#555' }}>Département : Bureaux des Méthodes</div>
          </div>
          <div className="doc-header-ref">
            <div style={{ fontSize: '8pt' }}>Réf. doc: FT-MOD-{model.code}</div>
            <div style={{ fontSize: '8pt' }}>Édition: 1</div>
            <div style={{ fontSize: '8pt' }}>Date: {today}</div>
          </div>
        </div>
      </div>

      {/* Informations modèle */}
      <div className="section-title">01 — IDENTIFICATION DU MODÈLE</div>
      <table style={{ marginBottom: 6 }}>
        <tbody>
          <tr>
            <td style={{ width: '20%', fontWeight: 'bold', background: '#f0f0f0' }}>Référence</td>
            <td style={{ width: '30%' }}>{model.code}</td>
            <td style={{ width: '20%', fontWeight: 'bold', background: '#f0f0f0' }}>Catégorie</td>
            <td style={{ width: '30%' }}>{model.category}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Désignation</td>
            <td colSpan={3}><strong>{model.name}</strong></td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Description</td>
            <td colSpan={3}>{model.description || ' '}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Prix de vente</td>
            <td>{model.salePrice ? `${Number(model.salePrice).toLocaleString('fr-DZ')} DZD` : '—'}</td>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Statut</td>
            <td>Actif</td>
          </tr>
        </tbody>
      </table>

      {/* Zone croquis */}
      <div className="section-title">02 — CROQUIS / ECHANTILLON</div>
      <div className="sketch-zone" style={{ minHeight: 100 }}>
        [ Zone réservée au dessin technique / photo échantillon ]
      </div>

      {/* Nomenclature matières */}
      <div className="section-title">03 — NOMENCLATURE DES MATIÈRES PREMIÈRES</div>
      <table>
        <thead>
          <tr>
            <th style={{ width: '5%' }}>N°</th>
            <th style={{ width: '35%' }}>Désignation matière</th>
            <th style={{ width: '10%' }}>Code</th>
            <th style={{ width: '12%' }}>Unité</th>
            <th style={{ width: '12%' }}>Qté / pièce</th>
            <th style={{ width: '13%' }}>Prix unit. (DZD)</th>
            <th style={{ width: '13%' }}>Montant (DZD)</th>
          </tr>
        </thead>
        <tbody>
          {model.components.map((c, i) => (
            <tr key={c.id} className={i % 2 === 1 ? 'row-alt' : ''}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td>{c.material.name}</td>
              <td style={{ textAlign: 'center', fontSize: '8pt' }}>{c.material.code}</td>
              <td style={{ textAlign: 'center' }}>{c.material.unit}</td>
              <td style={{ textAlign: 'right' }}>{Number(c.quantity).toFixed(4)}</td>
              <td style={{ textAlign: 'right' }}>{Number(c.material.unitCost).toLocaleString('fr-DZ')}</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                {(Number(c.quantity) * Number(c.material.unitCost)).toFixed(2)}
              </td>
            </tr>
          ))}
          {/* Lignes vides si peu de composants */}
          {model.components.length < 5 && [...Array(5 - model.components.length)].map((_, i) => (
            <tr key={`empty-${i}`} style={{ height: 18 }}>
              <td style={{ textAlign: 'center' }}>{model.components.length + i + 1}</td>
              <td></td><td></td><td></td><td></td><td></td><td></td>
            </tr>
          ))}
          <tr style={{ background: '#e8e8e8', fontWeight: 'bold' }}>
            <td colSpan={6} style={{ textAlign: 'right' }}>TOTAL MATIÈRES</td>
            <td style={{ textAlign: 'right' }}>{cost ? Number(cost.materialsCost).toFixed(2) : '—'}</td>
          </tr>
        </tbody>
      </table>

      {/* Gamme opératoire */}
      <div className="section-title">04 — GAMME OPÉRATOIRE</div>
      <table>
        <thead>
          <tr>
            <th style={{ width: '5%' }}>N°</th>
            <th style={{ width: '32%' }}>Opération</th>
            <th style={{ width: '20%' }}>Machine / Équipement</th>
            <th style={{ width: '14%' }}>TMO (min)</th>
            <th style={{ width: '14%' }}>Coût MO (DZD)</th>
            <th style={{ width: '15%' }}>Observations</th>
          </tr>
        </thead>
        <tbody>
          {model.operations.map((op, i) => (
            <tr key={op.id} className={i % 2 === 1 ? 'row-alt' : ''}>
              <td style={{ textAlign: 'center' }}>{op.sequence}</td>
              <td>{op.name}</td>
              <td style={{ fontSize: '9pt' }}>{op.machineType || '—'}</td>
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{Number(op.standardMinutes).toFixed(2)}</td>
              <td style={{ textAlign: 'right' }}>
                {cost ? (Number(op.standardMinutes) * cost.coutMinute).toFixed(2) : '—'}
              </td>
              <td></td>
            </tr>
          ))}
          {model.operations.length < 5 && [...Array(5 - model.operations.length)].map((_, i) => (
            <tr key={`empty-op-${i}`} style={{ height: 18 }}>
              <td style={{ textAlign: 'center' }}>{model.operations.length + i + 1}</td>
              <td></td><td></td><td></td><td></td><td></td>
            </tr>
          ))}
          <tr style={{ background: '#e8e8e8', fontWeight: 'bold' }}>
            <td colSpan={3} style={{ textAlign: 'right' }}>TOTAL TEMPS STANDARD</td>
            <td style={{ textAlign: 'center' }}>{totalMins.toFixed(2)} min</td>
            <td style={{ textAlign: 'right' }}>{cost ? Number(cost.laborCost).toFixed(2) : '—'}</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      {/* Récapitulatif coûts */}
      <div className="section-title">05 — RÉCAPITULATIF DES COÛTS</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div className="cost-summary">
          <div className="cost-row">
            <span>Coût matières premières</span>
            <span><strong>{cost ? Number(cost.materialsCost).toFixed(2) : '—'}</strong> DZD</span>
          </div>
          <div className="cost-row">
            <span>Coût main d'œuvre directe</span>
            <span><strong>{cost ? Number(cost.laborCost).toFixed(2) : '—'}</strong> DZD</span>
          </div>
          <div className="cost-row">
            <span>Frais généraux (overhead)</span>
            <span><strong>{cost ? Number(cost.overheadCost).toFixed(2) : '—'}</strong> DZD</span>
          </div>
          <div className="cost-row-total">
            <span>COÛT DE REVIENT</span>
            <span>{cost ? Number(cost.totalCost).toFixed(2) : '—'} DZD</span>
          </div>
        </div>
        <div className="cost-summary">
          <div className="cost-row">
            <span>Prix de vente HT</span>
            <span><strong>{model.salePrice ? Number(model.salePrice).toFixed(2) : '—'}</strong> DZD</span>
          </div>
          <div className="cost-row">
            <span>Marge brute</span>
            <span><strong>
              {cost && model.salePrice
                ? (Number(model.salePrice) - cost.totalCost).toFixed(2)
                : '—'}
            </strong> DZD</span>
          </div>
          <div className="cost-row">
            <span>Taux de marge</span>
            <span><strong>
              {cost && model.salePrice && cost.totalCost > 0
                ? (((Number(model.salePrice) - cost.totalCost) / Number(model.salePrice)) * 100).toFixed(1)
                : '—'}
            </strong> %</span>
          </div>
          <div className="cost-row">
            <span>Coût Minute utilisé</span>
            <span><strong>{cost ? Number(cost.coutMinute).toFixed(4) : '—'}</strong> DZD</span>
          </div>
        </div>
      </div>

      {/* Instructions spéciales */}
      <div className="section-title">06 — INSTRUCTIONS SPÉCIALES / CONTRÔLE QUALITÉ</div>
      <table>
        <tbody>
          <tr style={{ height: 50 }}>
            <td style={{ verticalAlign: 'top', padding: 6 }}>
              <div style={{ fontSize: '8pt', color: '#666', marginBottom: 4 }}>Points de contrôle qualité :</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Signatures */}
      <div className="section-title">07 — VALIDATION</div>
      <table>
        <tbody>
          <tr>
            <td style={{ width: '33%', textAlign: 'center', padding: 8 }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: 4 }}>Établi par (Bureau des Méthodes)</div>
              <div className="sign-line" />
              <div style={{ fontSize: '8pt' }}>Nom & Visa</div>
              <div style={{ fontSize: '8pt', marginTop: 4 }}>Date: ___________</div>
            </td>
            <td style={{ width: '33%', textAlign: 'center', padding: 8 }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: 4 }}>Vérifié par (Chef Atelier)</div>
              <div className="sign-line" />
              <div style={{ fontSize: '8pt' }}>Nom & Visa</div>
              <div style={{ fontSize: '8pt', marginTop: 4 }}>Date: ___________</div>
            </td>
            <td style={{ width: '33%', textAlign: 'center', padding: 8 }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: 4 }}>Approuvé par (Directeur)</div>
              <div className="sign-line" />
              <div style={{ fontSize: '8pt' }}>Nom & Visa</div>
              <div style={{ fontSize: '8pt', marginTop: 4 }}>Date: ___________</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Pied de page */}
      <div style={{ marginTop: 8, borderTop: '1px solid #ccc', paddingTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: '7.5pt', color: '#888' }}>
        <span>{atelierName} — Fiche Technique {model.code}</span>
        <span>Imprimé le {today} — Document interne confidentiel</span>
        <span>Page 1/1</span>
      </div>
    </div>
  );
}
