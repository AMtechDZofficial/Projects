import { useQuery } from '@tanstack/react-query';
import { productionApi, modelsApi } from '../../services/api';
import { ProductionOrder, CoutureModel } from '../../types';
import { format } from 'date-fns';

interface Props {
  orderId: string;
  atelierName?: string;
}

const statusLabel = {
  EN_ATTENTE: 'En attente', EN_COURS: 'En cours', TERMINE: 'Terminé', ANNULE: 'Annulé'
};

export default function OrdreDefabrication({ orderId, atelierName = 'ATELIER DE COUTURE' }: Props) {
  const { data: order } = useQuery<ProductionOrder>({
    queryKey: ['order', orderId],
    queryFn: () => productionApi.getOrder(orderId).then(r => r.data)
  });

  const { data: model } = useQuery<CoutureModel>({
    queryKey: ['model-detail', order?.modelId],
    queryFn: () => modelsApi.getOne(order!.modelId).then(r => r.data),
    enabled: !!order?.modelId
  });

  const today = format(new Date(), 'dd/MM/yyyy');
  const qty = order?.quantity || 0;

  return (
    <div className="form-print-wrap">

      {/* En-tête */}
      <div className="doc-header">
        <div className="doc-header-title">ORDRE DE FABRICATION (OF)</div>
        <div className="doc-header-sub">
          <div className="doc-header-atelier">
            <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{atelierName}</div>
            <div style={{ fontSize: '8pt', color: '#555' }}>Service Production</div>
          </div>
          <div className="doc-header-ref">
            <div style={{ fontSize: '10pt', fontWeight: 'bold' }}>N° {order?.orderNumber || '—'}</div>
            <div style={{ fontSize: '8pt' }}>Date émission: {today}</div>
            <div style={{ fontSize: '8pt' }}>Statut: <strong>{order ? statusLabel[order.status] : '—'}</strong></div>
          </div>
        </div>
      </div>

      {/* Identification */}
      <div className="section-title">01 — IDENTIFICATION DE L'ORDRE</div>
      <table style={{ marginBottom: 6 }}>
        <tbody>
          <tr>
            <td style={{ width: '18%', fontWeight: 'bold', background: '#f0f0f0' }}>N° OF</td>
            <td style={{ width: '32%' }}><strong style={{ fontSize: '12pt' }}>{order?.orderNumber}</strong></td>
            <td style={{ width: '18%', fontWeight: 'bold', background: '#f0f0f0' }}>Date début prév.</td>
            <td style={{ width: '32%' }}>{order?.startDate ? format(new Date(order.startDate), 'dd/MM/yyyy') : '___________'}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Modèle</td>
            <td><strong>{model?.name}</strong></td>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Date fin prév.</td>
            <td>{order?.endDate ? format(new Date(order.endDate), 'dd/MM/yyyy') : '___________'}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Référence modèle</td>
            <td>{model?.code}</td>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Catégorie</td>
            <td>{model?.category}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Quantité totale</td>
            <td><strong style={{ fontSize: '14pt', color: '#1a1a2e' }}>{qty} pièces</strong></td>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>N° Client / Commande</td>
            <td>___________________________</td>
          </tr>
        </tbody>
      </table>
      {order?.notes && (
        <table style={{ marginBottom: 6 }}>
          <tbody>
            <tr>
              <td style={{ fontWeight: 'bold', background: '#f0f0f0', width: '18%' }}>Notes / Instructions</td>
              <td>{order.notes}</td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Planification par opération */}
      <div className="section-title">02 — PLANIFICATION & SUIVI DES OPÉRATIONS</div>
      <table style={{ marginBottom: 6 }}>
        <thead>
          <tr>
            <th style={{ width: '5%' }}>N°</th>
            <th style={{ width: '25%' }}>Opération</th>
            <th style={{ width: '16%' }}>Machine</th>
            <th style={{ width: '10%' }}>TMO (min)</th>
            <th style={{ width: '12%' }}>Opérateur affecté</th>
            <th style={{ width: '10%' }}>Qté prévue</th>
            <th style={{ width: '10%' }}>Qté réalisée</th>
            <th style={{ width: '12%' }}>Date réalisation</th>
          </tr>
        </thead>
        <tbody>
          {(model?.operations || []).map((op, i) => (
            <tr key={op.id} className={i % 2 === 1 ? 'row-alt' : ''}>
              <td style={{ textAlign: 'center' }}>{op.sequence}</td>
              <td>{op.name}</td>
              <td style={{ fontSize: '8.5pt' }}>{op.machineType || '—'}</td>
              <td style={{ textAlign: 'center' }}>{Number(op.standardMinutes).toFixed(1)}</td>
              <td></td>
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{qty}</td>
              <td></td>
              <td></td>
            </tr>
          ))}
          {(!model?.operations || model.operations.length === 0) && [1, 2, 3, 4, 5].map(i => (
            <tr key={i} style={{ height: 20 }}>
              <td style={{ textAlign: 'center' }}>{i}</td>
              <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
            </tr>
          ))}
          <tr style={{ background: '#e8e8e8', fontWeight: 'bold' }}>
            <td colSpan={3} style={{ textAlign: 'right' }}>TOTAL TEMPS THÉORIQUE</td>
            <td style={{ textAlign: 'center' }}>
              {(model?.operations || []).reduce((s, op) => s + Number(op.standardMinutes), 0).toFixed(1)} min
            </td>
            <td></td>
            <td style={{ textAlign: 'center' }}>{qty}</td>
            <td></td><td></td>
          </tr>
        </tbody>
      </table>

      {/* Matières premières à sortir */}
      <div className="section-title">03 — SORTIE MATIÈRES PREMIÈRES</div>
      <table style={{ marginBottom: 6 }}>
        <thead>
          <tr>
            <th>Matière / Composant</th>
            <th style={{ width: '10%' }}>Unité</th>
            <th style={{ width: '14%' }}>Qté / pièce</th>
            <th style={{ width: '14%' }}>Qté totale théo.</th>
            <th style={{ width: '14%' }}>Qté sortie réelle</th>
            <th style={{ width: '14%' }}>Restant / Retour</th>
            <th style={{ width: '12%' }}>Visa magasin</th>
          </tr>
        </thead>
        <tbody>
          {(model?.components || []).map((c, i) => (
            <tr key={c.id} className={i % 2 === 1 ? 'row-alt' : ''}>
              <td>{c.material.name}</td>
              <td style={{ textAlign: 'center' }}>{c.material.unit}</td>
              <td style={{ textAlign: 'right' }}>{Number(c.quantity).toFixed(4)}</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{(Number(c.quantity) * qty).toFixed(3)}</td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          ))}
          {(!model?.components || model.components.length === 0) && [1, 2, 3].map(i => (
            <tr key={i} style={{ height: 20 }}>
              <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Suivi avancement */}
      <div className="section-title">04 — SUIVI D'AVANCEMENT</div>
      <table style={{ marginBottom: 6 }}>
        <thead>
          <tr>
            <th style={{ width: '16%' }}>Date</th>
            <th style={{ width: '25%' }}>Phase / Remarque</th>
            <th style={{ width: '15%' }}>Qté produite</th>
            <th style={{ width: '12%' }}>Qté défectueuse</th>
            <th style={{ width: '15%' }}>Responsable</th>
            <th style={{ width: '17%' }}>Visa</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4].map(i => (
            <tr key={i} style={{ height: 20 }}>
              <td></td><td></td><td></td><td></td><td></td><td></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Signatures */}
      <div className="section-title">05 — SIGNATURES ET VALIDATION</div>
      <table>
        <tbody>
          <tr>
            <td style={{ width: '25%', textAlign: 'center', padding: 8 }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: 4 }}>Émis par</div>
              <div className="sign-line" /><div style={{ fontSize: '8pt' }}>Nom & Visa</div>
              <div style={{ fontSize: '8pt' }}>Date: ___________</div>
            </td>
            <td style={{ width: '25%', textAlign: 'center', padding: 8 }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: 4 }}>Chef Atelier</div>
              <div className="sign-line" /><div style={{ fontSize: '8pt' }}>Nom & Visa</div>
              <div style={{ fontSize: '8pt' }}>Date: ___________</div>
            </td>
            <td style={{ width: '25%', textAlign: 'center', padding: 8 }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: 4 }}>Livré / Réceptionné</div>
              <div className="sign-line" /><div style={{ fontSize: '8pt' }}>Nom & Visa</div>
              <div style={{ fontSize: '8pt' }}>Date: ___________</div>
            </td>
            <td style={{ width: '25%', textAlign: 'center', padding: 8 }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: 4 }}>Directeur Production</div>
              <div className="sign-line" /><div style={{ fontSize: '8pt' }}>Nom & Visa</div>
              <div style={{ fontSize: '8pt' }}>Date: ___________</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 6, borderTop: '1px solid #ccc', paddingTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: '7.5pt', color: '#888' }}>
        <span>{atelierName} — OF {order?.orderNumber}</span>
        <span>Imprimé le {today}</span>
        <span>Page 1/1</span>
      </div>
    </div>
  );
}
