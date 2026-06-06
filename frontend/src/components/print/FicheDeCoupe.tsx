import { useQuery } from '@tanstack/react-query';
import { productionApi, modelsApi } from '../../services/api';
import { ProductionOrder, CoutureModel } from '../../types';
import { format } from 'date-fns';

interface Props {
  orderId?: string;
  modelId?: string;
  quantity?: number;
  atelierName?: string;
}

export default function FicheDeCoupe({ orderId, modelId, quantity, atelierName = 'ATELIER DE COUTURE' }: Props) {
  const { data: order } = useQuery<ProductionOrder>({
    queryKey: ['order', orderId],
    queryFn: () => productionApi.getOrder(orderId!).then(r => r.data),
    enabled: !!orderId
  });

  const resolvedModelId = order?.modelId || modelId;

  const { data: model } = useQuery<CoutureModel>({
    queryKey: ['model-detail', resolvedModelId],
    queryFn: () => modelsApi.getOne(resolvedModelId!).then(r => r.data),
    enabled: !!resolvedModelId
  });

  const today = format(new Date(), 'dd/MM/yyyy');
  const qty = order?.quantity || quantity || 0;

  // Calcul tissu : composants de type tissu
  const tissuComponents = model?.components.filter(c =>
    c.material.category === 'TISSU' || c.material.category === 'DOUBLURE'
  ) || [];

  return (
    <div className="form-print-wrap">

      {/* En-tête */}
      <div className="doc-header">
        <div className="doc-header-title">FICHE DE COUPE</div>
        <div className="doc-header-sub">
          <div className="doc-header-atelier">
            <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{atelierName}</div>
            <div style={{ fontSize: '8pt', color: '#555' }}>Département : Coupe</div>
          </div>
          <div className="doc-header-ref">
            <div style={{ fontSize: '8pt' }}>N° OF: <strong>{order?.orderNumber || '___________'}</strong></div>
            <div style={{ fontSize: '8pt' }}>Réf: FC-{order?.orderNumber || 'XXXX'}</div>
            <div style={{ fontSize: '8pt' }}>Date: {today}</div>
          </div>
        </div>
      </div>

      {/* Infos ordre */}
      <div className="section-title">01 — IDENTIFICATION</div>
      <table style={{ marginBottom: 6 }}>
        <tbody>
          <tr>
            <td style={{ width: '18%', fontWeight: 'bold', background: '#f0f0f0' }}>N° Ordre</td>
            <td style={{ width: '32%' }}>{order?.orderNumber || '___________________'}</td>
            <td style={{ width: '18%', fontWeight: 'bold', background: '#f0f0f0' }}>Date coupe</td>
            <td style={{ width: '32%' }}>___________________</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Modèle</td>
            <td colSpan={3}><strong>{model?.name || '___________________'}</strong> — Réf: {model?.code || '___'}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Quantité totale</td>
            <td><strong style={{ fontSize: '12pt' }}>{qty || '______'}</strong> pièces</td>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Opérateur(s)</td>
            <td>___________________</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Coloris / Variante</td>
            <td>___________________</td>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Matelas N°</td>
            <td>___________________</td>
          </tr>
        </tbody>
      </table>

      {/* Répartition tailles/coloris */}
      <div className="section-title">02 — RÉPARTITION PAR TAILLE ET COLORIS</div>
      <table style={{ marginBottom: 6 }}>
        <thead>
          <tr>
            <th>Coloris / Réf.</th>
            <th>XS</th>
            <th>S</th>
            <th>M</th>
            <th>L</th>
            <th>XL</th>
            <th>XXL</th>
            <th style={{ background: '#555' }}>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3].map(row => (
            <tr key={row} style={{ height: 20 }}>
              <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
              <td style={{ fontWeight: 'bold', background: '#f5f5f5' }}></td>
            </tr>
          ))}
          <tr style={{ fontWeight: 'bold', background: '#e8e8e8' }}>
            <td>TOTAL TAILLE</td>
            <td></td><td></td><td></td><td></td><td></td><td></td>
            <td style={{ textAlign: 'center' }}>{qty}</td>
          </tr>
        </tbody>
      </table>

      {/* Consommation matières */}
      <div className="section-title">03 — CONSOMMATION MATIÈRES (PLAN DE COUPE)</div>
      <table style={{ marginBottom: 6 }}>
        <thead>
          <tr>
            <th style={{ width: '25%' }}>Tissu / Matière</th>
            <th style={{ width: '10%' }}>Laize (cm)</th>
            <th style={{ width: '13%' }}>Consomm. / pce (m)</th>
            <th style={{ width: '10%' }}>Nb couches</th>
            <th style={{ width: '13%' }}>Long. matelas (m)</th>
            <th style={{ width: '10%' }}>Déchet (%)</th>
            <th style={{ width: '10%' }}>Qté théo. (m)</th>
            <th style={{ width: '10%' }}>Qté réelle (m)</th>
          </tr>
        </thead>
        <tbody>
          {tissuComponents.length > 0 ? tissuComponents.map((c, i) => (
            <tr key={c.id} className={i % 2 === 1 ? 'row-alt' : ''}>
              <td>{c.material.name}</td>
              <td></td>
              <td style={{ textAlign: 'right' }}>{Number(c.quantity).toFixed(3)}</td>
              <td></td>
              <td></td>
              <td></td>
              <td style={{ textAlign: 'right' }}>{(Number(c.quantity) * qty).toFixed(2)}</td>
              <td></td>
            </tr>
          )) : [1, 2, 3].map(i => (
            <tr key={i} style={{ height: 22 }}>
              <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Liste des pièces à couper */}
      <div className="section-title">04 — LISTE DES PIÈCES À COUPER</div>
      <table style={{ marginBottom: 6 }}>
        <thead>
          <tr>
            <th style={{ width: '5%' }}>N°</th>
            <th style={{ width: '30%' }}>Désignation de la pièce</th>
            <th style={{ width: '10%' }}>Symétrie</th>
            <th style={{ width: '12%' }}>Sens du fil</th>
            <th style={{ width: '10%' }}>Nb / jeu</th>
            <th style={{ width: '10%' }}>Nb total</th>
            <th style={{ width: '23%' }}>Remarques</th>
          </tr>
        </thead>
        <tbody>
          {['Devant', 'Dos', 'Manche D.', 'Manche G.', 'Col', 'Patte boutonnage', 'Poignets', 'Poche'].map((piece, i) => (
            <tr key={i} className={i % 2 === 1 ? 'row-alt' : ''}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td style={{ fontSize: '9pt' }}>{piece}</td>
              <td style={{ textAlign: 'center', fontSize: '9pt' }}>□ Sym □ Non</td>
              <td style={{ textAlign: 'center', fontSize: '9pt' }}>□ droit □ biais</td>
              <td style={{ textAlign: 'center' }}>1</td>
              <td style={{ textAlign: 'center' }}>{qty}</td>
              <td></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Contrôle qualité coupe */}
      <div className="section-title">05 — CONTRÔLE QUALITÉ COUPE</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <table>
          <thead><tr><th colSpan={3}>AVANT COUPE</th></tr></thead>
          <tbody>
            {[
              'Tissu conforme (coloris, laize)',
              'Gabarits vérifiés et approuvés',
              'Sens du fil vérifié',
              'Quantité pièces comptées',
              'Plan de placement approuvé'
            ].map((item, i) => (
              <tr key={i}>
                <td style={{ width: 20, textAlign: 'center' }}><span className="checkbox-box" /></td>
                <td style={{ fontSize: '8.5pt' }}>{item}</td>
                <td style={{ width: 40, fontSize: '8pt', textAlign: 'center' }}>OK / NOK</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table>
          <thead><tr><th colSpan={3}>APRÈS COUPE</th></tr></thead>
          <tbody>
            {[
              'Pièces comptées et conformes',
              'Qualité de coupe (nettes)',
              'Crans de montage repérés',
              'Pièces étiquetées / numérotées',
              'Déchet mesuré et enregistré'
            ].map((item, i) => (
              <tr key={i}>
                <td style={{ width: 20, textAlign: 'center' }}><span className="checkbox-box" /></td>
                <td style={{ fontSize: '8.5pt' }}>{item}</td>
                <td style={{ width: 40, fontSize: '8pt', textAlign: 'center' }}>OK / NOK</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Signatures */}
      <div className="section-title">06 — SIGNATURES</div>
      <table>
        <tbody>
          <tr>
            <td style={{ width: '33%', textAlign: 'center', padding: '6px 8px' }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: 4 }}>Coupeur Principal</div>
              <div className="sign-line" /><div style={{ fontSize: '8pt' }}>Nom & Visa</div>
              <div style={{ fontSize: '8pt', marginTop: 4 }}>Date: ___________</div>
            </td>
            <td style={{ width: '33%', textAlign: 'center', padding: '6px 8px' }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: 4 }}>Contrôleur Qualité</div>
              <div className="sign-line" /><div style={{ fontSize: '8pt' }}>Nom & Visa</div>
              <div style={{ fontSize: '8pt', marginTop: 4 }}>Date: ___________</div>
            </td>
            <td style={{ width: '33%', textAlign: 'center', padding: '6px 8px' }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: 4 }}>Chef Atelier / Responsable</div>
              <div className="sign-line" /><div style={{ fontSize: '8pt' }}>Nom & Visa</div>
              <div style={{ fontSize: '8pt', marginTop: 4 }}>Date: ___________</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 6, borderTop: '1px solid #ccc', paddingTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: '7.5pt', color: '#888' }}>
        <span>{atelierName} — Fiche de Coupe {order?.orderNumber}</span>
        <span>Imprimé le {today}</span>
        <span>Page 1/1</span>
      </div>
    </div>
  );
}
