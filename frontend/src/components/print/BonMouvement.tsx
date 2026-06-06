import { format } from 'date-fns';

interface MaterialLine {
  code?: string;
  name?: string;
  unit?: string;
  quantity?: number;
  unitCost?: number;
}

interface Props {
  type: 'ENTREE' | 'SORTIE';
  reference?: string;
  date?: string;
  supplierOrDest?: string;
  items?: MaterialLine[];
  notes?: string;
  atelierName?: string;
}

export default function BonMouvement({
  type, reference, date, supplierOrDest, items = [], notes, atelierName = 'ATELIER DE COUTURE'
}: Props) {
  const today = format(new Date(), 'dd/MM/yyyy');
  const docDate = date ? format(new Date(date), 'dd/MM/yyyy') : today;
  const isEntree = type === 'ENTREE';
  const totalAmount = items.reduce((s, i) => s + (Number(i.quantity || 0) * Number(i.unitCost || 0)), 0);

  // S'assurer qu'il y a au moins 8 lignes dans le tableau
  const lines: MaterialLine[] = [...items];
  while (lines.length < 8) lines.push({});

  return (
    <div className="form-print-wrap">

      {/* En-tête */}
      <div className="doc-header">
        <div className="doc-header-title">
          {isEntree ? 'BON DE RÉCEPTION / ENTRÉE MATIÈRES' : 'BON DE SORTIE MATIÈRES'}
        </div>
        <div className="doc-header-sub">
          <div className="doc-header-atelier">
            <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{atelierName}</div>
            <div style={{ fontSize: '8pt', color: '#555' }}>Magasin / Stock Matières Premières</div>
          </div>
          <div className="doc-header-ref">
            <div style={{ fontSize: '10pt', fontWeight: 'bold' }}>
              N° {isEntree ? 'BR' : 'BS'}-{reference || '___________'}
            </div>
            <div style={{ fontSize: '8pt' }}>Date: <strong>{docDate}</strong></div>
            <div style={{ fontSize: '8pt' }}>Édité le: {today}</div>
          </div>
        </div>
      </div>

      {/* Infos bon */}
      <div className="section-title">01 — INFORMATIONS GÉNÉRALES</div>
      <table style={{ marginBottom: 6 }}>
        <tbody>
          <tr>
            <td style={{ width: '20%', fontWeight: 'bold', background: '#f0f0f0' }}>Type de mouvement</td>
            <td style={{ width: '30%' }}>
              <strong style={{ color: isEntree ? '#065f46' : '#7f1d1d', fontSize: '11pt' }}>
                {isEntree ? '⬆ ENTRÉE (Réception)' : '⬇ SORTIE (Utilisation)'}
              </strong>
            </td>
            <td style={{ width: '20%', fontWeight: 'bold', background: '#f0f0f0' }}>Date mouvement</td>
            <td style={{ width: '30%' }}>{docDate}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>
              {isEntree ? 'Fournisseur' : 'Destiné à (OF / Poste)'}
            </td>
            <td colSpan={3}>{supplierOrDest || '___________________________________'}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>
              {isEntree ? 'N° BL Fournisseur / Facture' : 'N° Ordre de Fabrication'}
            </td>
            <td>___________________________</td>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Responsable magasin</td>
            <td>___________________________</td>
          </tr>
        </tbody>
      </table>

      {/* Tableau matières */}
      <div className="section-title">02 — DÉTAIL DES ARTICLES</div>
      <table style={{ marginBottom: 6 }}>
        <thead>
          <tr>
            <th style={{ width: '5%' }}>N°</th>
            <th style={{ width: '12%' }}>Code article</th>
            <th style={{ width: '33%' }}>Désignation</th>
            <th style={{ width: '10%' }}>Unité</th>
            <th style={{ width: '10%' }}>Qté demandée</th>
            <th style={{ width: '10%' }}>Qté livrée</th>
            <th style={{ width: '12%' }}>Prix unitaire</th>
            <th style={{ width: '12%' }}>Montant (DZD)</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((item, i) => (
            <tr key={i} className={i % 2 === 1 ? 'row-alt' : ''} style={{ height: item.name ? undefined : 20 }}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td style={{ fontSize: '8.5pt', textAlign: 'center' }}>{item.code || ''}</td>
              <td>{item.name || ''}</td>
              <td style={{ textAlign: 'center' }}>{item.unit || ''}</td>
              <td style={{ textAlign: 'right' }}>{item.quantity ? Number(item.quantity).toFixed(3) : ''}</td>
              <td></td>
              <td style={{ textAlign: 'right' }}>{item.unitCost ? Number(item.unitCost).toFixed(2) : ''}</td>
              <td style={{ textAlign: 'right', fontWeight: item.name ? 'bold' : undefined }}>
                {item.name && item.quantity && item.unitCost
                  ? (Number(item.quantity) * Number(item.unitCost)).toFixed(2)
                  : ''}
              </td>
            </tr>
          ))}
          <tr style={{ fontWeight: 'bold', background: '#e8e8e8' }}>
            <td colSpan={7} style={{ textAlign: 'right' }}>TOTAL GÉNÉRAL</td>
            <td style={{ textAlign: 'right', fontSize: '10pt' }}>
              {totalAmount > 0 ? totalAmount.toLocaleString('fr-DZ', { minimumFractionDigits: 2 }) : ''}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Observations */}
      <table style={{ marginBottom: 8 }}>
        <tbody>
          <tr style={{ minHeight: 40 }}>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0', width: '15%' }}>Observations</td>
            <td style={{ verticalAlign: 'top', minHeight: 36 }}>{notes || ' '}</td>
          </tr>
        </tbody>
      </table>

      {/* Contrôle qualité (pour entrée) */}
      {isEntree && (
        <>
          <div className="section-title">03 — CONTRÔLE RÉCEPTION</div>
          <table style={{ marginBottom: 8 }}>
            <tbody>
              {[
                ['Conformité quantité commandée', '□ Conforme □ Écart'],
                ['Conformité qualité / aspect', '□ Conforme □ Défauts'],
                ['Conformité références / coloris', '□ Conforme □ Écart'],
                ['Conditionnement intact', '□ Oui □ Non']
              ].map(([label, value], i) => (
                <tr key={i}>
                  <td style={{ width: '55%', fontWeight: 'bold', background: '#f9f9f9' }}>{label}</td>
                  <td style={{ fontSize: '9pt' }}>{value}</td>
                  <td style={{ width: '25%', fontSize: '8pt' }}>Remarque: _______________</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Signatures */}
      <div className="section-title">{isEntree ? '04' : '03'} — SIGNATURES</div>
      <table>
        <tbody>
          <tr>
            <td style={{ width: '33%', textAlign: 'center', padding: '8px 6px' }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: 4 }}>
                {isEntree ? 'Livreur / Fournisseur' : 'Demandeur (Chef atelier)'}
              </div>
              <div className="sign-line" />
              <div style={{ fontSize: '8pt' }}>Nom & Signature</div>
              <div style={{ fontSize: '8pt' }}>Date: ___________</div>
            </td>
            <td style={{ width: '33%', textAlign: 'center', padding: '8px 6px' }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: 4 }}>Responsable Magasin</div>
              <div className="sign-line" />
              <div style={{ fontSize: '8pt' }}>Nom & Visa</div>
              <div style={{ fontSize: '8pt' }}>Date: ___________</div>
            </td>
            <td style={{ width: '33%', textAlign: 'center', padding: '8px 6px' }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: 4 }}>Direction / Comptabilité</div>
              <div className="sign-line" />
              <div style={{ fontSize: '8pt' }}>Nom & Visa</div>
              <div style={{ fontSize: '8pt' }}>Date: ___________</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 6, borderTop: '1px solid #ccc', paddingTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: '7.5pt', color: '#888' }}>
        <span>{atelierName} — {isEntree ? 'Bon de Réception' : 'Bon de Sortie'} N° {reference}</span>
        <span>Imprimé le {today} — Original: Comptabilité / Copie: Magasin</span>
        <span>Page 1/1</span>
      </div>
    </div>
  );
}
