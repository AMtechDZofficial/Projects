import { useQuery } from '@tanstack/react-query';
import { modelsApi } from '../../services/api';
import { CoutureModel, PrototypeDev } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  modelId: string;
  atelierName?: string;
}

const DECISION_COLOR: Record<string, string> = {
  CONTINUER: '#2d7d2d',
  MODIFIER: '#b87600',
  ABANDONNER: '#c0392b'
};

function fmtDate(d?: string | null): string {
  if (!d) return '___/___/______';
  try { return format(new Date(d), 'dd/MM/yyyy', { locale: fr }); } catch { return '—'; }
}

function StageRow({ label, date, notes, decision, isLast }: {
  label: string;
  date?: string | null;
  notes?: string | null;
  decision?: string | null;
  isLast?: boolean;
}) {
  return (
    <tr style={{ background: isLast ? '#f0fdf0' : undefined }}>
      <td style={{ fontWeight: 'bold', background: isLast ? '#d4edda' : '#f0f0f0', width: '16%', fontSize: '9pt' }}>{label}</td>
      <td style={{ width: '14%', textAlign: 'center', fontSize: '9pt' }}>{fmtDate(date)}</td>
      <td style={{ width: '44%', fontSize: '9pt', whiteSpace: 'pre-wrap' }}>{notes || ' '}</td>
      <td style={{ width: '16%', textAlign: 'center', fontWeight: decision ? 'bold' : 'normal', color: decision ? DECISION_COLOR[decision] || '#333' : '#aaa', fontSize: '9pt' }}>
        {decision || '— En cours —'}
      </td>
      <td style={{ width: '10%', textAlign: 'center' }}>
        <span className="checkbox-box" style={{ background: decision === 'CONTINUER' || (isLast && decision === 'VALIDE') ? '#333' : 'white', display: 'inline-block' }} />
      </td>
    </tr>
  );
}

export default function FicheDeveloppementPrototype({ modelId, atelierName = 'ATELIER DE COUTURE' }: Props) {
  const { data: model } = useQuery<CoutureModel>({
    queryKey: ['model-full', modelId],
    queryFn: () => modelsApi.getFull(modelId).then(r => r.data)
  });

  if (!model) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  const today = format(new Date(), 'dd/MM/yyyy');
  const proto: PrototypeDev | null | undefined = model.prototypeDev;

  return (
    <div className="form-print-wrap">

      <div className="doc-header">
        <div className="doc-header-title">FICHE DÉVELOPPEMENT PROTOTYPE</div>
        <div className="doc-header-sub">
          <div className="doc-header-atelier">
            <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{atelierName}</div>
            <div style={{ fontSize: '8pt', color: '#555' }}>Bureau des Méthodes — Développement Produit</div>
          </div>
          <div className="doc-header-ref">
            <div style={{ fontSize: '8pt' }}>Réf. doc: PROTO-{model.code}</div>
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
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Responsable</td>
            <td>{proto?.responsable || '___________________________'}</td>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Prêt pour production</td>
            <td style={{ fontWeight: 'bold', color: proto?.productionReady ? '#2d7d2d' : '#c0392b' }}>
              {proto?.productionReady ? 'OUI ✓' : 'NON'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Cycle de vie */}
      <div className="section-title">02 — CYCLE DE VIE DU PROTOTYPE</div>
      <table style={{ marginBottom: 6 }}>
        <thead>
          <tr>
            <th style={{ width: '16%' }}>Étape</th>
            <th style={{ width: '14%', textAlign: 'center' }}>Date</th>
            <th style={{ width: '44%' }}>Observations / Notes</th>
            <th style={{ width: '16%', textAlign: 'center' }}>Décision</th>
            <th style={{ width: '10%', textAlign: 'center' }}>Visé</th>
          </tr>
        </thead>
        <tbody>
          <StageRow
            label="Toile initiale"
            date={proto?.toileDate}
            notes={proto?.toileNotes}
          />
          <StageRow
            label="Prototype 1"
            date={proto?.proto1Date}
            notes={proto?.proto1Notes}
            decision={proto?.proto1Decision}
          />
          <StageRow
            label="Prototype 2"
            date={proto?.proto2Date}
            notes={proto?.proto2Notes}
            decision={proto?.proto2Decision}
          />
          <StageRow
            label="Validation finale"
            date={proto?.validationDate}
            notes={proto?.validationNotes}
            decision={proto?.productionReady ? 'VALIDE' : proto?.proto2Decision}
            isLast
          />
        </tbody>
      </table>

      {/* Chrono visuel */}
      <div className="section-title">03 — CHRONOLOGIE</div>
      <table style={{ marginBottom: 6 }}>
        <thead>
          <tr>
            <th>Étape</th>
            <th style={{ textAlign: 'center' }}>Début prévu</th>
            <th style={{ textAlign: 'center' }}>Date réalisée</th>
            <th style={{ textAlign: 'center' }}>Délai (jours)</th>
            <th>Commentaire</th>
          </tr>
        </thead>
        <tbody>
          {['Lancement brief', 'Réception tissus prototype', 'Confection toile', 'Essayage 1', 'Corrections patron', 'Confection proto 1', 'Essayage 2', 'Corrections finales', 'Proto validé', 'Lancement série'].map((step, i) => (
            <tr key={step} style={{ height: 14 }} className={i % 2 === 1 ? 'row-alt' : ''}>
              <td style={{ fontSize: '8.5pt' }}>{step}</td>
              <td /><td /><td /><td />
            </tr>
          ))}
        </tbody>
      </table>

      {/* Problèmes et résolutions */}
      <div className="section-title">04 — PROBLÈMES RENCONTRÉS & SOLUTIONS APPORTÉES</div>
      <table style={{ marginBottom: 6 }}>
        <thead>
          <tr>
            <th style={{ width: '5%' }}>N°</th>
            <th style={{ width: '30%' }}>Problème identifié</th>
            <th style={{ width: '30%' }}>Solution apportée</th>
            <th style={{ width: '15%' }}>Responsable</th>
            <th style={{ width: '20%' }}>Statut</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i} style={{ height: 16 }}>
              <td style={{ textAlign: 'center' }}>{i + 1}</td>
              <td /><td /><td /><td />
            </tr>
          ))}
        </tbody>
      </table>

      {/* Signatures */}
      <div className="section-title">05 — VALIDATION & SIGNATURES</div>
      <table>
        <tbody>
          <tr>
            {['Modéliste / Créateur', 'Bureau des Méthodes', 'Direction Technique'].map(label => (
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
        <span>{atelierName} — Développement Prototype {model.code}</span>
        <span>Imprimé le {today}</span>
        <span>Page 1/1</span>
      </div>
    </div>
  );
}
