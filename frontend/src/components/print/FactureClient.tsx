import { useQuery } from '@tanstack/react-query';
import { invoicesApi } from '../../services/api';
import type { Invoice } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const paymentMethodLabel: Record<string, string> = {
  VIREMENT: 'Virement bancaire', CHEQUE: 'Chèque', ESPECES: 'Espèces', TRAITE: 'Traite', AUTRE: 'Autre'
};

export default function FactureClient({ invoiceId }: { invoiceId: string }) {
  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => invoicesApi.getOne(invoiceId).then(r => r.data as Invoice)
  });

  if (isLoading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;
  if (!invoice) return <div className="p-8 text-center text-red-400">Facture introuvable</div>;

  const subtotal = Number(invoice.subtotal);
  const tvaAmount = Number(invoice.tvaAmount);
  const timbre = Number(invoice.timbre);
  const totalTTC = Number(invoice.totalAmount);
  const amountPaid = Number(invoice.amountPaid);
  const restant = totalTTC - amountPaid;

  const deliveryLines = invoice.delivery?.lines || [];
  const orderPriceMap = new Map(
    (invoice.delivery?.order?.lines || []).map(l => [`${l.modelId}:${l.colorRef || ''}`, Number(l.unitPrice)])
  );

  return (
    <div className="print-page font-sans text-sm text-gray-900" style={{ width: '210mm', minHeight: '297mm', padding: '15mm', boxSizing: 'border-box' }}>
      {/* En-tête */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary-700">CoutureGest</h1>
          <p className="text-xs text-gray-500 mt-0.5">Atelier de Confection Textile</p>
          <p className="text-xs text-gray-500">NIF: — / RC: — / RIB: —</p>
        </div>
        <div className="text-right">
          <div className="inline-block border-2 border-primary-600 rounded-xl px-6 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Facture</p>
            <p className="text-xl font-bold text-primary-700 mt-0.5">{invoice.invoiceNumber}</p>
            <p className="text-xs text-gray-400 mt-0.5">{format(new Date(invoice.invoiceDate), 'dd/MM/yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Infos client + facture */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Facturé à</p>
          <p className="font-bold text-base">{invoice.client.name}</p>
          {invoice.client.address && <p className="text-gray-600 mt-1">{invoice.client.address}</p>}
          {invoice.client.city && <p className="text-gray-600">{invoice.client.city}</p>}
          {invoice.client.rc && <p className="text-gray-500 text-xs mt-2">RC: {invoice.client.rc}</p>}
          {invoice.client.nif && <p className="text-gray-500 text-xs">NIF: {invoice.client.nif}</p>}
          {invoice.client.phone && <p className="text-gray-500 text-xs">Tél: {invoice.client.phone}</p>}
          {invoice.client.email && <p className="text-gray-500 text-xs">{invoice.client.email}</p>}
        </div>
        <div className="border border-gray-200 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Détails facture</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date facture:</span>
            <span className="font-medium">{format(new Date(invoice.invoiceDate), 'dd MMMM yyyy', { locale: fr })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Échéance:</span>
            <span className={`font-medium ${new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAYEE' ? 'text-red-600 font-bold' : ''}`}>
              {format(new Date(invoice.dueDate), 'dd MMMM yyyy', { locale: fr })}
            </span>
          </div>
          {invoice.delivery && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Réf. BL:</span>
              <span className="font-mono font-medium">{invoice.delivery.deliveryNumber}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Statut:</span>
            <span className={`font-bold ${invoice.status === 'PAYEE' ? 'text-green-600' : invoice.status === 'ANNULEE' ? 'text-red-500' : 'text-orange-500'}`}>
              {invoice.status === 'PAYEE' ? 'PAYÉE' : invoice.status === 'ANNULEE' ? 'ANNULÉE' : invoice.status === 'PARTIELLEMENT_PAYEE' ? 'PARTIELLEMENT PAYÉE' : 'ÉMISE'}
            </span>
          </div>
        </div>
      </div>

      {/* Articles */}
      {deliveryLines.length > 0 && (
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="bg-primary-700 text-white">
              <th className="py-3 px-4 text-left text-xs font-semibold uppercase">Désignation</th>
              <th className="py-3 px-4 text-left text-xs font-semibold uppercase">Coloris</th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase">Qté</th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase">P.U. HT</th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase">Montant HT</th>
            </tr>
          </thead>
          <tbody>
            {deliveryLines.map((line, idx) => {
              const unitPrice = orderPriceMap.get(`${line.modelId}:${line.colorRef || ''}`) ?? 0;
              return (
                <tr key={line.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-3 px-4 font-medium">{line.model.name}</td>
                  <td className="py-3 px-4 text-gray-600">{line.colorRef || '—'}</td>
                  <td className="py-3 px-4 text-right">{line.quantity}</td>
                  <td className="py-3 px-4 text-right">{unitPrice.toLocaleString('fr-DZ')} DZD</td>
                  <td className="py-3 px-4 text-right font-medium">{(line.quantity * unitPrice).toLocaleString('fr-DZ')} DZD</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Totaux */}
      <div className="flex justify-end mb-8">
        <div className="w-80">
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex justify-between px-4 py-2.5 border-b border-gray-100">
              <span className="text-gray-600">Sous-total HT</span>
              <span className="font-medium">{subtotal.toLocaleString('fr-DZ')} DZD</span>
            </div>
            <div className="flex justify-between px-4 py-2.5 border-b border-gray-100">
              <span className="text-gray-600">TVA ({invoice.tvaRate}%)</span>
              <span className="font-medium">{tvaAmount.toLocaleString('fr-DZ')} DZD</span>
            </div>
            {timbre > 0 && (
              <div className="flex justify-between px-4 py-2.5 border-b border-gray-100">
                <span className="text-gray-600">Timbre fiscal</span>
                <span className="font-medium">{timbre.toLocaleString('fr-DZ')} DZD</span>
              </div>
            )}
            <div className="flex justify-between px-4 py-3 bg-primary-700 text-white">
              <span className="font-bold text-base">TOTAL TTC</span>
              <span className="font-bold text-base">{totalTTC.toLocaleString('fr-DZ')} DZD</span>
            </div>
            {amountPaid > 0 && (
              <>
                <div className="flex justify-between px-4 py-2.5 bg-green-50 border-t border-green-100">
                  <span className="text-green-700">Déjà encaissé</span>
                  <span className="font-medium text-green-700">— {amountPaid.toLocaleString('fr-DZ')} DZD</span>
                </div>
                <div className="flex justify-between px-4 py-2.5 border-t border-gray-200">
                  <span className={`font-bold ${restant > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {restant > 0 ? 'Reste à payer' : 'Solde'}
                  </span>
                  <span className={`font-bold text-base ${restant > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {Math.abs(restant).toLocaleString('fr-DZ')} DZD
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Paiements reçus */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Historique des paiements</p>
          <table className="w-full border border-gray-200 rounded-xl overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Date</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Mode</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Référence</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Montant</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((p, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="py-2 px-3 text-xs">{format(new Date(p.paymentDate), 'dd/MM/yyyy')}</td>
                  <td className="py-2 px-3 text-xs">{paymentMethodLabel[p.method] || p.method}</td>
                  <td className="py-2 px-3 text-xs font-mono">{p.reference || '—'}</td>
                  <td className="py-2 px-3 text-xs text-right font-medium">{Number(p.amount).toLocaleString('fr-DZ')} DZD</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div className="mb-6 p-4 border border-gray-200 rounded-xl">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Notes</p>
          <p className="text-sm text-gray-700">{invoice.notes}</p>
        </div>
      )}

      {/* Conditions & Mentions légales */}
      <div className="mt-auto pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-8 text-xs text-gray-500">
          <div>
            <p className="font-semibold text-gray-600 mb-1">Conditions de paiement</p>
            <p>Paiement à {invoice.client.paymentTerms || 30} jours à compter de la date de facturation.</p>
            <p className="mt-1">Tout retard de paiement entraînera des pénalités conformément à la législation algérienne en vigueur.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-600 mb-1">Coordonnées bancaires</p>
            <p>RIB: —</p>
            <p>Banque: —</p>
            <p>IBAN: —</p>
          </div>
        </div>
        <div className="mt-4 text-center text-xs text-gray-400">
          <p>Document généré le {format(new Date(), 'dd/MM/yyyy à HH:mm')} — CoutureGest</p>
        </div>
      </div>
    </div>
  );
}
