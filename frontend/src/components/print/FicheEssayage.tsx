import { useQuery } from '@tanstack/react-query';
import { modelsApi } from '../../services/api';
import { CoutureModel, FittingSession } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DECISION_STYLE: Record<string, { label: string; color: string }> = {
  VALIDE: { label: 'VALIDÉ ✓', color: '#2d7d2d' },
  REVISION: { label: 'RÉVISION →', color: '#b87600' },
  REJETE: { label: 'REJETÉ ✗', color: '#c0392b' }
};

const ZONES = [
  'Col / Encolure', 'Épaules', 'Buste / Poitrine',
  'Manches / Emmanchures', 'Taille', 'Hanches',
  'Dos / Devant', 'Ourlet / Bas', 'Fermetures / Boutonnage'
];

interface Props {
  modelId: string;
  atelierName?: string;
}

function SessionBlock({ session, sessionNumber }: { session?: FittingSession; sessionNumber: number }) {
  const decInfo = session?.decision ? DECISION_STYLE[session.decision] : null;
  const dbZones: Array<{ zone: string; correction: string; patternModif: string }> =
    (session?.corrections as { zones?: Array<{ zone: string; correction: string; patternModif: string }> })?.zones || [];

  const zoneMap = new Map(dbZones.map(z => [z.zone, z]));

  return (
    <div style={{ marginBottom: 8 }}>
      <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>ESSAYAGE N°{sessionNumber}</span>
        {decInfo && (
          <span style={{ color: decInfo.color, fontWeight: 'bold', fontSize: '9pt' }}>{decInfo.label}</span>
        )}
      </div>
      <table style={{ marginBottom: 4 }}>
        <tbody>
          <tr>
            <td style={{ width: '20%', fontWeight: 'bold', background: '#f0f0f0' }}>Date</td>
            <td style={{ width: '30%' }}>{session?.date ? format(new Date(session.date), 'dd MMMM yyyy', { locale: fr }) : '___/___/______'}</td>
            <td style={{ width: '20%', fontWeight: 'bold', background: '#f0f0f0' }}>Essayé par</td>
            <td style={{ width: '30%' }}>{session?.fitterName || '___________________________'}</td>
          </tr>
        </tbody>
      </table>

      <table style={{ marginBottom: 4 }}>
        <thead>
          <tr>
            <th style={{ width: '22%' }}>Zone du vêtement</th>
            <th style={{ width: '38%' }}>Correction identifiée</th>
            <th style={{ width: '40%' }}>Modification patron requise</th>
          </tr>
        </thead>
        <tbody>
          {ZONES.map((zone, i) => {
            const z = zoneMap.get(zone);
            return (
              <tr key={zone} className={i % 2 === 1 ? 'row-alt' : ''} style={{ height: 16 }}>
                <td style={{ fontSize: '9pt', fontWeight: 'normal' }}>{zone}</td>
                <td style={{ fontSize: '9pt' }}>{z?.correction || ''}</td>
                <td style={{ fontSize: '9pt' }}>{z?.patternModif || ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <table style={{ marginBottom: 2 }}>
        <tbody>
          <tr>
            <td style={{ width: '20%', fontWeight: 'bold', background: '#f0f0f0' }}>Notes générales</td>
            <td style={{ minHeight: 24, verticalAlign: 'top' }}>{session?.notes || ' '}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Décision finale</td>
            <td>
              <div style={{ display: 'flex', gap: 16 }}>
                {Object.entries(DECISION_STYLE).map(([k, v]) => (
                  <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '9pt' }}>
                    <span className="checkbox-box" style={{ background: session?.decision === k ? '#333' : 'white' }} />
                    <span style={{ color: session?.decision === k ? v.color : '#333', fontWeight: session?.decision === k ? 'bold' : 'normal' }}>
                      {v.label}
                    </span>
                  </span>
                ))}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function FicheEssayage({ modelId, atelierName = 'ATELIER DE COUTURE' }: Props) {
  const { data: model } = useQuery<CoutureModel>({
    queryKey: ['model-full', modelId],
    queryFn: () => modelsApi.getFull(modelId).then(r => r.data)
  });

  if (!model) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  const sessions = model.fittingSessions || [];
  const today = format(new Date(), 'dd/MM/yyyy');

  const getSession = (n: number) => sessions.find(s => s.sessionNumber === n);

  const finalDecision = sessions.length > 0
    ? sessions[sessions.length - 1].decision
    : undefined;

  return (
    <div className="form-print-wrap">

      <div className="doc-header">
        <div className="doc-header-title">FICHE ESSAYAGE & CORRECTIONS</div>
        <div className="doc-header-sub">
          <div className="doc-header-atelier">
            <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{atelierName}</div>
            <div style={{ fontSize: '8pt', color: '#555' }}>Bureau des Méthodes — Développement Produit</div>
          </div>
          <div className="doc-header-ref">
            <div style={{ fontSize: '8pt' }}>Réf. doc: ESS-{model.code}</div>
            <div style={{ fontSize: '8pt' }}>Date: {today}</div>
          </div>
        </div>
      </div>

      {/* Identification */}
      <div className="section-title">IDENTIFICATION DU MODÈLE</div>
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

      {/* 3 sessions */}
      <SessionBlock session={getSession(1)} sessionNumber={1} />
      <SessionBlock session={getSession(2)} sessionNumber={2} />
      <SessionBlock session={getSession(3)} sessionNumber={3} />

      {/* Synthèse */}
      <div className="section-title">SYNTHÈSE FINALE</div>
      <table style={{ marginBottom: 6 }}>
        <tbody>
          <tr>
            <td style={{ width: '25%', fontWeight: 'bold', background: '#f0f0f0' }}>Nombre d'essayages réalisés</td>
            <td style={{ width: '25%' }}>{sessions.length} / 3</td>
            <td style={{ width: '25%', fontWeight: 'bold', background: '#f0f0f0' }}>Décision finale</td>
            <td style={{ fontWeight: 'bold', color: finalDecision ? DECISION_STYLE[finalDecision]?.color : '#333' }}>
              {finalDecision ? DECISION_STYLE[finalDecision]?.label : '— En attente —'}
            </td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Patron validé pour production</td>
            <td>
              <span className="checkbox-box" style={{ background: finalDecision === 'VALIDE' ? '#333' : 'white' }} />
              {' '} OUI &nbsp;&nbsp;
              <span className="checkbox-box" style={{ background: finalDecision !== 'VALIDE' ? '#333' : 'white' }} />
              {' '} NON
            </td>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Date validation patron</td>
            <td>{finalDecision === 'VALIDE' && sessions.length > 0 && sessions[sessions.length - 1].date
              ? format(new Date(sessions[sessions.length - 1].date!), 'dd/MM/yyyy')
              : '___________'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Signatures */}
      <div className="section-title">VISA</div>
      <table>
        <tbody>
          <tr>
            {['Modéliste / Patronnier', 'Chef de Produit', 'Directeur Artistique'].map(label => (
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
        <span>{atelierName} — Fiche Essayage {model.code}</span>
        <span>Imprimé le {today}</span>
        <span>Page 1/1</span>
      </div>
    </div>
  );
}
