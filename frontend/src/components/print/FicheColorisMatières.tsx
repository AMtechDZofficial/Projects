import { useQuery } from '@tanstack/react-query';
import { modelsApi } from '../../services/api';
import { CoutureModel, ColorVariant } from '../../types';
import { format } from 'date-fns';

interface Props {
  modelId: string;
  atelierName?: string;
}

function ColorSwatch({ code }: { code?: string }) {
  if (!code) return <span style={{ color: '#bbb', fontSize: '8pt' }}>—</span>;
  const isHex = /^#[0-9A-Fa-f]{6}$/.test(code);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {isHex && (
        <div style={{
          width: 14, height: 14, borderRadius: 2, border: '1px solid #ccc',
          background: code, flexShrink: 0
        }} />
      )}
      <span style={{ fontSize: '8pt', fontFamily: 'monospace' }}>{code}</span>
    </div>
  );
}

export default function FicheColorisMatières({ modelId, atelierName = 'ATELIER DE COUTURE' }: Props) {
  const { data: model } = useQuery<CoutureModel>({
    queryKey: ['model-full', modelId],
    queryFn: () => modelsApi.getFull(modelId).then(r => r.data)
  });

  if (!model) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  const today = format(new Date(), 'dd/MM/yyyy');
  const variants: ColorVariant[] = model.colorVariants || [];
  const validated = variants.filter(v => v.isValidated);

  const emptyRows = 8;

  return (
    <div className="form-print-wrap">

      <div className="doc-header">
        <div className="doc-header-title">FICHE COLORIS & MATIÈRES</div>
        <div className="doc-header-sub">
          <div className="doc-header-atelier">
            <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{atelierName}</div>
            <div style={{ fontSize: '8pt', color: '#555' }}>Bureau des Méthodes — Référentiel Couleurs</div>
          </div>
          <div className="doc-header-ref">
            <div style={{ fontSize: '8pt' }}>Réf. doc: COL-{model.code}</div>
            <div style={{ fontSize: '8pt' }}>Date: {today}</div>
          </div>
        </div>
      </div>

      {/* Identification */}
      <div className="section-title">01 — IDENTIFICATION DU MODÈLE</div>
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
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Nb variantes</td>
            <td>{variants.length}</td>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Validées</td>
            <td style={{ color: validated.length > 0 ? '#2d7d2d' : '#333' }}><strong>{validated.length}</strong></td>
          </tr>
        </tbody>
      </table>

      {/* Tableau variantes */}
      <div className="section-title">02 — RÉFÉRENTIEL DES VARIANTES COLORIS</div>
      <table style={{ marginBottom: 6 }}>
        <thead>
          <tr>
            <th style={{ width: '5%' }}>N°</th>
            <th style={{ width: '16%' }}>Nom Coloris</th>
            <th style={{ width: '14%' }}>Code Couleur</th>
            <th style={{ width: '16%' }}>Réf. Tissu Principal</th>
            <th style={{ width: '16%' }}>Réf. Doublure</th>
            <th style={{ width: '17%' }}>Réf. Accessoires</th>
            <th style={{ width: '8%', textAlign: 'center' }}>Validé</th>
            <th style={{ width: '8%' }}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((v, i) => (
            <tr key={v.id} className={i % 2 === 1 ? 'row-alt' : ''}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td style={{ fontWeight: 'bold' }}>{v.colorName}</td>
              <td><ColorSwatch code={v.colorCode} /></td>
              <td style={{ fontSize: '9pt', fontFamily: 'monospace' }}>{v.fabricRef || '—'}</td>
              <td style={{ fontSize: '9pt', fontFamily: 'monospace' }}>{v.liningRef || '—'}</td>
              <td style={{ fontSize: '9pt' }}>{v.accessoriesRefs || '—'}</td>
              <td style={{ textAlign: 'center', fontWeight: 'bold', color: v.isValidated ? '#2d7d2d' : '#c0392b' }}>
                {v.isValidated ? '✓' : '✗'}
              </td>
              <td style={{ fontSize: '8pt' }}>{v.notes || ''}</td>
            </tr>
          ))}
          {variants.length === 0 && [...Array(emptyRows)].map((_, i) => (
            <tr key={i} style={{ height: 18 }}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td /><td /><td /><td /><td />
              <td style={{ textAlign: 'center' }}>
                <span className="checkbox-box" />
              </td>
              <td />
            </tr>
          ))}
          {variants.length > 0 && variants.length < emptyRows && [...Array(emptyRows - variants.length)].map((_, i) => (
            <tr key={`e${i}`} style={{ height: 18 }}>
              <td style={{ textAlign: 'center' }}>{variants.length + i + 1}</td>
              <td /><td /><td /><td /><td />
              <td style={{ textAlign: 'center' }}><span className="checkbox-box" /></td>
              <td />
            </tr>
          ))}
        </tbody>
      </table>

      {/* Combinaisons validées */}
      <div className="section-title">03 — COMBINAISONS VALIDÉES & NOTES COMMERCIALES</div>
      <table style={{ marginBottom: 6 }}>
        <thead>
          <tr>
            <th style={{ width: '20%' }}>Coloris principal</th>
            <th style={{ width: '20%' }}>Coloris secondaire</th>
            <th style={{ width: '20%' }}>Accessoires assortis</th>
            <th style={{ width: '20%' }}>Saison / Collection</th>
            <th style={{ width: '20%' }}>Observations</th>
          </tr>
        </thead>
        <tbody>
          {validated.length > 0 ? validated.map((v, i) => (
            <tr key={v.id} style={{ height: 16 }} className={i % 2 === 1 ? 'row-alt' : ''}>
              <td style={{ fontWeight: 'bold' }}>{v.colorName}</td>
              <td /><td /><td />
              <td style={{ fontSize: '8pt' }}>{v.notes || ''}</td>
            </tr>
          )) : (
            [...Array(5)].map((_, i) => (
              <tr key={i} style={{ height: 16 }}>
                <td /><td /><td /><td /><td />
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Nuancier visuel */}
      {variants.some(v => v.colorCode && /^#[0-9A-Fa-f]{6}$/.test(v.colorCode)) && (
        <>
          <div className="section-title">04 — NUANCIER VISUEL</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8, padding: '6px 0' }}>
            {variants.filter(v => v.colorCode && /^#[0-9A-Fa-f]{6}$/.test(v.colorCode!)).map(v => (
              <div key={v.id} style={{ textAlign: 'center', width: 52 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 4, margin: '0 auto 2px',
                  background: v.colorCode!, border: '1px solid #ccc',
                  boxShadow: v.isValidated ? '0 0 0 2px #2d7d2d' : undefined
                }} />
                <div style={{ fontSize: '7pt', lineHeight: 1.2 }}>{v.colorName}</div>
                <div style={{ fontSize: '6.5pt', color: '#666', fontFamily: 'monospace' }}>{v.colorCode}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Signatures */}
      <div className="section-title">VALIDATION</div>
      <table>
        <tbody>
          <tr>
            {['Styliste / Créateur', 'Chef de Produit', 'Direction Commerciale'].map(label => (
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
        <span>{atelierName} — Fiche Coloris {model.code}</span>
        <span>Imprimé le {today} — Confidentiel</span>
        <span>Page 1/1</span>
      </div>
    </div>
  );
}
