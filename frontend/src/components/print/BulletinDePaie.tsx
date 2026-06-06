import { Payroll } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  payroll: Payroll;
  atelierName?: string;
  atelierAddress?: string;
}

const payTypeLabel = { PIECE: 'Paiement à la pièce', CHAINE: 'Chaîne de production', HORAIRE: 'Salaire horaire', MENSUEL: 'Salaire mensuel fixe' };

export default function BulletinDePaie({ payroll: p, atelierName = 'ATELIER DE COUTURE', atelierAddress = 'Alger, Algérie' }: Props) {
  const today = format(new Date(), 'dd/MM/yyyy');
  const emp = p.employee;
  const net = Number(p.totalAmount);
  const periodLabel = `${format(new Date(p.periodStart), 'MMMM yyyy', { locale: fr })}`;

  return (
    <div className="form-print-wrap">

      {/* En-tête */}
      <div className="doc-header">
        <div className="doc-header-title">BULLETIN DE PAIE</div>
        <div className="doc-header-sub">
          <div className="doc-header-atelier">
            <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{atelierName}</div>
            <div style={{ fontSize: '8.5pt' }}>{atelierAddress}</div>
            <div style={{ fontSize: '8.5pt' }}>NIF: ___________________</div>
          </div>
          <div className="doc-header-ref">
            <div style={{ fontSize: '8pt' }}>N° Bulletin: BP-{p.id.slice(-6).toUpperCase()}</div>
            <div style={{ fontSize: '8pt' }}>Mois: <strong>{periodLabel.toUpperCase()}</strong></div>
            <div style={{ fontSize: '8pt' }}>Édité le: {today}</div>
          </div>
        </div>
      </div>

      {/* Infos employé */}
      <div className="section-title">INFORMATIONS EMPLOYÉ</div>
      <table style={{ marginBottom: 8 }}>
        <tbody>
          <tr>
            <td style={{ width: '20%', fontWeight: 'bold', background: '#f0f0f0' }}>Matricule</td>
            <td style={{ width: '30%' }}><strong>{emp.employeeId}</strong></td>
            <td style={{ width: '20%', fontWeight: 'bold', background: '#f0f0f0' }}>Mode de paie</td>
            <td style={{ width: '30%' }}>{payTypeLabel[emp.paymentType]}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Nom & Prénom</td>
            <td><strong style={{ fontSize: '11pt' }}>{emp.lastName.toUpperCase()} {emp.firstName}</strong></td>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Période</td>
            <td>
              <strong>Du</strong> {format(new Date(p.periodStart), 'dd/MM/yyyy')}
              <strong> au</strong> {format(new Date(p.periodEnd), 'dd/MM/yyyy')}
            </td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Jours travaillés</td>
            <td>{p.workDays} jours</td>
            <td style={{ fontWeight: 'bold', background: '#f0f0f0' }}>Heures travaillées</td>
            <td>{Number(p.hoursWorked).toFixed(1)} h</td>
          </tr>
        </tbody>
      </table>

      {/* Corps bulletin */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

        {/* Colonne GAINS */}
        <div>
          <table>
            <thead>
              <tr><th colSpan={3}>GAINS & RÉMUNÉRATIONS</th></tr>
              <tr>
                <th style={{ background: '#555', width: '55%' }}>Libellé</th>
                <th style={{ background: '#555', width: '20%' }}>Base</th>
                <th style={{ background: '#555', width: '25%' }}>Montant (DZD)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Salaire de base</td>
                <td style={{ textAlign: 'right', fontSize: '8.5pt' }}>
                  {emp.paymentType === 'MENSUEL' ? 'Fixe' :
                   emp.paymentType === 'HORAIRE' ? `${p.hoursWorked}h` : '—'}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {Number(p.baseSalary).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="row-alt">
                <td>Gains à la pièce</td>
                <td style={{ textAlign: 'right', fontSize: '8.5pt' }}>Pièces</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: Number(p.pieceEarnings) > 0 ? '#065f46' : undefined }}>
                  {Number(p.pieceEarnings).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr>
                <td>Prime chaîne</td>
                <td></td>
                <td style={{ textAlign: 'right' }}>
                  {Number(p.chainBonus).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="row-alt">
                <td>Prime supplémentaire</td>
                <td></td>
                <td style={{ textAlign: 'right' }}>
                  {Number(p.bonus).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr>
                <td>Heures supplémentaires</td>
                <td></td>
                <td style={{ textAlign: 'right' }}>0,00</td>
              </tr>
              <tr>
                <td>Indemnité transport</td>
                <td></td>
                <td style={{ textAlign: 'right' }}>0,00</td>
              </tr>
              <tr style={{ fontWeight: 'bold', background: '#d1fae5' }}>
                <td colSpan={2} style={{ textAlign: 'right' }}>TOTAL BRUT</td>
                <td style={{ textAlign: 'right', fontSize: '10.5pt' }}>
                  {(Number(p.baseSalary) + Number(p.pieceEarnings) + Number(p.chainBonus) + Number(p.bonus)).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Colonne RETENUES */}
        <div>
          <table>
            <thead>
              <tr><th colSpan={3}>RETENUES & DÉDUCTIONS</th></tr>
              <tr>
                <th style={{ background: '#555', width: '55%' }}>Libellé</th>
                <th style={{ background: '#555', width: '15%' }}>Taux</th>
                <th style={{ background: '#555', width: '30%' }}>Montant (DZD)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cotisation CNAS (9%)</td>
                <td style={{ textAlign: 'center' }}>9%</td>
                <td style={{ textAlign: 'right' }}>
                  {(Number(p.baseSalary) * 0.09).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="row-alt">
                <td>IRG / Impôt sur salaire</td>
                <td style={{ textAlign: 'center' }}>—</td>
                <td style={{ textAlign: 'right' }}>0,00</td>
              </tr>
              <tr>
                <td>Retenues sur avances</td>
                <td></td>
                <td style={{ textAlign: 'right' }}>0,00</td>
              </tr>
              <tr className="row-alt">
                <td>Absences / Retards</td>
                <td></td>
                <td style={{ textAlign: 'right' }}>0,00</td>
              </tr>
              <tr>
                <td>Autres déductions</td>
                <td></td>
                <td style={{ textAlign: 'right' }}>
                  {Number(p.deductions).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr>
                <td>—</td><td></td><td></td>
              </tr>
              <tr style={{ fontWeight: 'bold', background: '#fee2e2' }}>
                <td colSpan={2} style={{ textAlign: 'right' }}>TOTAL RETENUES</td>
                <td style={{ textAlign: 'right', fontSize: '10.5pt' }}>
                  {(Number(p.baseSalary) * 0.09 + Number(p.deductions)).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* NET À PAYER */}
      <div style={{ margin: '8px 0', border: '3px solid #1a1a2e', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a1a2e' }}>
        <span style={{ color: 'white', fontSize: '12pt', fontWeight: 'bold', letterSpacing: '0.05em' }}>NET À PAYER</span>
        <span style={{ color: '#ffd700', fontSize: '20pt', fontWeight: 'bold' }}>
          {net.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DZD
        </span>
      </div>

      {/* Mode de paiement */}
      <table style={{ marginBottom: 8 }}>
        <tbody>
          <tr>
            <td style={{ width: '25%', fontWeight: 'bold', background: '#f0f0f0' }}>Mode de paiement</td>
            <td style={{ width: '25%' }}>
              <span className="checkbox-box" style={{ marginRight: 4 }} /> Espèces
              &nbsp;&nbsp;<span className="checkbox-box" style={{ marginRight: 4 }} /> Virement
              &nbsp;&nbsp;<span className="checkbox-box" style={{ marginRight: 4 }} /> Chèque
            </td>
            <td style={{ width: '25%', fontWeight: 'bold', background: '#f0f0f0' }}>Date de paiement</td>
            <td style={{ width: '25%' }}>{p.paidAt ? format(new Date(p.paidAt), 'dd/MM/yyyy') : '___________'}</td>
          </tr>
        </tbody>
      </table>

      {/* Signatures */}
      <table>
        <tbody>
          <tr>
            <td style={{ width: '50%', textAlign: 'center', padding: '8px 12px' }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: 4 }}>Signature de l'employeur / Service RH</div>
              <div className="sign-line" />
              <div style={{ fontSize: '8pt' }}>Cachet & Visa</div>
            </td>
            <td style={{ width: '50%', textAlign: 'center', padding: '8px 12px' }}>
              <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: 4 }}>Signature de l'employé (reçu paiement)</div>
              <div className="sign-line" />
              <div style={{ fontSize: '8pt' }}>Nom & Signature</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 6, borderTop: '1px solid #ccc', paddingTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: '7.5pt', color: '#888' }}>
        <span>{atelierName} — Bulletin de paie {periodLabel}</span>
        <span>Document confidentiel — {emp.lastName} {emp.firstName} ({emp.employeeId})</span>
        <span>Page 1/1</span>
      </div>
    </div>
  );
}
