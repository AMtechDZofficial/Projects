import { useQuery } from '@tanstack/react-query';
import { employeesApi, modelsApi } from '../../services/api';
import { Employee, CoutureModel, PieceProduction } from '../../types';
import { format, startOfWeek, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  employeeId?: string;
  weekDate?: Date;
  mode?: 'daily' | 'weekly';
  atelierName?: string;
}

export default function FicheOperateur({ employeeId, weekDate = new Date(), mode = 'weekly', atelierName = 'ATELIER DE COUTURE' }: Props) {
  const { data: employee } = useQuery<Employee>({
    queryKey: ['employee', employeeId],
    queryFn: () => employeesApi.getOne(employeeId!).then(r => r.data),
    enabled: !!employeeId
  });

  const weekStart = startOfWeek(weekDate, { weekStartsOn: 0 });
  const weekDays = [0, 1, 2, 3, 4, 5].map(d => addDays(weekStart, d));

  const { data: productions = [] } = useQuery<PieceProduction[]>({
    queryKey: ['employee-productions', employeeId, weekStart],
    queryFn: () => employeesApi.getProductions(employeeId!, {
      startDate: weekStart.toISOString(),
      endDate: addDays(weekStart, 6).toISOString()
    }).then(r => r.data),
    enabled: !!employeeId
  });

  const today = format(new Date(), 'dd/MM/yyyy');
  const totalPieces = productions.reduce((s, p) => s + p.quantity, 0);
  const totalEarnings = productions.reduce((s, p) => s + Number(p.totalAmount), 0);

  // Lignes de saisie (12 lignes minimum pour formulaire vierge)
  const prodLines = [...productions];
  while (prodLines.length < 12) prodLines.push({} as PieceProduction);

  return (
    <div className="form-print-wrap">

      {/* En-tête */}
      <div className="doc-header">
        <div className="doc-header-title">FICHE DE PRODUCTION OPÉRATEUR</div>
        <div className="doc-header-sub">
          <div className="doc-header-atelier">
            <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{atelierName}</div>
            <div style={{ fontSize: '8pt', color: '#555' }}>Suivi Production Individuel</div>
          </div>
          <div className="doc-header-ref">
            <div style={{ fontSize: '8pt' }}>Semaine: {format(weekStart, 'dd/MM')} – {format(addDays(weekStart, 5), 'dd/MM/yyyy')}</div>
            <div style={{ fontSize: '8pt' }}>Édité le: {today}</div>
          </div>
        </div>
      </div>

      {/* Infos opérateur */}
      <div className="section-title">01 — INFORMATIONS OPÉRATEUR</div>
      <table style={{ marginBottom: 6 }}>
        <tbody>
          <tr>
            <td style={{ width: '18%', fontWeight: 'bold', background: '#f0f0f0' }}>Matricule</td>
            <td style={{ width: '32%' }}><strong>{employee?.employeeId || '___________'}</strong></td>
            <td style={{ width: '18%', fontWeight: 'bold', background: '#f0f0f0' }}>Poste</td>
            <td style={{ width: '32%' }}>{employee?.position || '___________________________'}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Nom & Prénom</td>
            <td>
              <strong style={{ fontSize: '11pt' }}>
                {employee ? `${employee.lastName.toUpperCase()} ${employee.firstName}` : '_____________________________'}
              </strong>
            </td>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Département</td>
            <td>{employee?.department || '___________________________'}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Mode de paie</td>
            <td>
              {employee?.paymentType === 'PIECE' ? '✓ À la pièce' :
               employee?.paymentType === 'CHAINE' ? '✓ Chaîne' : '___________'}
            </td>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Superviseur</td>
            <td>___________________________</td>
          </tr>
        </tbody>
      </table>

      {/* Présence journalière */}
      <div className="section-title">02 — PRÉSENCES DE LA SEMAINE</div>
      <table style={{ marginBottom: 6 }}>
        <thead>
          <tr>
            <th style={{ width: '18%' }}>Jour</th>
            <th style={{ width: '14%' }}>Date</th>
            <th style={{ width: '12%' }}>Arrivée</th>
            <th style={{ width: '12%' }}>Départ</th>
            <th style={{ width: '12%' }}>H. Normales</th>
            <th style={{ width: '12%' }}>H. Suppl.</th>
            <th style={{ width: '20%' }}>Observations</th>
          </tr>
        </thead>
        <tbody>
          {weekDays.map((day, i) => {
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            return (
              <tr key={i} className={i % 2 === 1 ? 'row-alt' : ''} style={{ fontWeight: isToday ? 'bold' : undefined }}>
                <td style={{ textAlign: 'center' }}>{format(day, 'EEEE', { locale: fr })}</td>
                <td style={{ textAlign: 'center' }}>{format(day, 'dd/MM/yyyy')}</td>
                <td></td><td></td>
                <td style={{ textAlign: 'center' }}>8h</td>
                <td></td><td></td>
              </tr>
            );
          })}
          <tr style={{ fontWeight: 'bold', background: '#e8e8e8' }}>
            <td colSpan={4} style={{ textAlign: 'right' }}>TOTAL SEMAINE</td>
            <td style={{ textAlign: 'center' }}>48h</td>
            <td></td><td></td>
          </tr>
        </tbody>
      </table>

      {/* Saisie production */}
      <div className="section-title">03 — SAISIE DE PRODUCTION (PAR PIÈCE / OPÉRATION)</div>
      <table style={{ marginBottom: 6 }}>
        <thead>
          <tr>
            <th style={{ width: '5%' }}>N°</th>
            <th style={{ width: '12%' }}>Date</th>
            <th style={{ width: '22%' }}>Modèle</th>
            <th style={{ width: '22%' }}>Opération</th>
            <th style={{ width: '12%' }}>Qté matin</th>
            <th style={{ width: '12%' }}>Qté après-midi</th>
            <th style={{ width: '8%' }}>TOTAL</th>
            <th style={{ width: '8%' }}>Tarif</th>
          </tr>
        </thead>
        <tbody>
          {prodLines.map((prod, i) => {
            const p = prod as PieceProduction;
            return (
              <tr key={i} className={i % 2 === 1 ? 'row-alt' : ''} style={{ height: p.id ? undefined : 20 }}>
                <td style={{ textAlign: 'center' }}>{i + 1}</td>
                <td style={{ fontSize: '8.5pt' }}>
                  {p.date ? format(new Date(p.date), 'dd/MM') : ''}
                </td>
                <td style={{ fontSize: '8.5pt' }}>{p.model?.code || ''}</td>
                <td style={{ fontSize: '8.5pt' }}>{p.operation?.name || ''}</td>
                <td></td>
                <td></td>
                <td style={{ textAlign: 'center', fontWeight: p.id ? 'bold' : undefined }}>
                  {p.quantity || ''}
                </td>
                <td style={{ textAlign: 'right', fontSize: '8.5pt' }}>
                  {p.pieceRate ? Number(p.pieceRate).toFixed(2) : ''}
                </td>
              </tr>
            );
          })}
          <tr style={{ fontWeight: 'bold', background: '#e8e8e8' }}>
            <td colSpan={6} style={{ textAlign: 'right' }}>TOTAL SEMAINE</td>
            <td style={{ textAlign: 'center', fontSize: '11pt', color: '#1a1a2e' }}>
              {totalPieces > 0 ? totalPieces : ''}
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>

      {/* Récapitulatif gains */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <table>
          <thead><tr><th colSpan={2}>RÉCAPITULATIF PAR MODÈLE</th></tr></thead>
          <tbody>
            {productions.length > 0
              ? Object.entries(
                  productions.reduce<Record<string, { name: string; qty: number; amount: number }>>((acc, p) => {
                    const key = p.model?.code || 'N/A';
                    if (!acc[key]) acc[key] = { name: p.model?.name || 'N/A', qty: 0, amount: 0 };
                    acc[key].qty += p.quantity;
                    acc[key].amount += Number(p.totalAmount);
                    return acc;
                  }, {})
                ).map(([code, data], i) => (
                  <tr key={i}>
                    <td style={{ fontSize: '8.5pt' }}>{code} — {data.name}</td>
                    <td style={{ textAlign: 'right', fontSize: '8.5pt' }}>{data.qty} pcs</td>
                  </tr>
                ))
              : [1, 2, 3, 4].map(i => <tr key={i} style={{ height: 18 }}><td></td><td></td></tr>)
            }
          </tbody>
        </table>
        <div className="cost-summary" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="cost-row">
            <span>Total pièces produites</span>
            <span style={{ fontWeight: 'bold', fontSize: '13pt', color: '#1a1a2e' }}>{totalPieces || '—'} pcs</span>
          </div>
          <div className="cost-row">
            <span>Gains à la pièce</span>
            <span style={{ fontWeight: 'bold' }}>{totalEarnings > 0 ? totalEarnings.toFixed(2) : '—'} DZD</span>
          </div>
          <div className="cost-row">
            <span>Rendement (vs objectif)</span>
            <span>_______  %</span>
          </div>
          <div className="cost-row-total">
            <span>TOTAL ESTIMÉ</span>
            <span style={{ color: '#065f46' }}>{totalEarnings > 0 ? totalEarnings.toFixed(2) : '—'} DZD</span>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="section-title">04 — VALIDATION</div>
      <table>
        <tbody>
          <tr>
            <td style={{ width: '33%', textAlign: 'center', padding: 8 }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: 4 }}>Opérateur</div>
              <div className="sign-line" /><div style={{ fontSize: '8pt' }}>Signature</div>
            </td>
            <td style={{ width: '33%', textAlign: 'center', padding: 8 }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: 4 }}>Contrôleur / Superviseur</div>
              <div className="sign-line" /><div style={{ fontSize: '8pt' }}>Nom & Visa</div>
            </td>
            <td style={{ width: '33%', textAlign: 'center', padding: 8 }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: 4 }}>Chef Atelier</div>
              <div className="sign-line" /><div style={{ fontSize: '8pt' }}>Nom & Visa</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 6, borderTop: '1px solid #ccc', paddingTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: '7.5pt', color: '#888' }}>
        <span>{atelierName} — Fiche Opérateur {employee?.employeeId}</span>
        <span>Semaine du {format(weekStart, 'dd/MM/yyyy')}</span>
        <span>Page 1/1</span>
      </div>
    </div>
  );
}
