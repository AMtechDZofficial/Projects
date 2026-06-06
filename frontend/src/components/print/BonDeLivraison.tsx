import { useQuery } from '@tanstack/react-query';
import { deliveriesApi } from '../../services/api';
import type { Delivery } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function BonDeLivraison({ deliveryId }: { deliveryId: string }) {
  const { data: delivery, isLoading } = useQuery({
    queryKey: ['delivery', deliveryId],
    queryFn: () => deliveriesApi.getOne(deliveryId).then(r => r.data as Delivery)
  });

  if (isLoading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;
  if (!delivery) return <div className="p-8 text-center text-red-400">Bon de livraison introuvable</div>;

  const totalQty = delivery.lines.reduce((s, l) => s + l.quantity, 0);

  return (
    <div className="print-page font-sans text-sm text-gray-900" style={{ width: '210mm', minHeight: '297mm', padding: '15mm', boxSizing: 'border-box' }}>
      {/* En-tête */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary-700">CoutureGest</h1>
          <p className="text-xs text-gray-500 mt-1">Atelier de Confection</p>
        </div>
        <div className="text-right">
          <div className="inline-block border-2 border-primary-600 rounded-xl px-6 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Bon de Livraison</p>
            <p className="text-xl font-bold text-primary-700 mt-1">{delivery.deliveryNumber}</p>
          </div>
        </div>
      </div>

      {/* Informations */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Destinataire</p>
          <p className="font-bold text-base">{delivery.order.client.name}</p>
          {delivery.order.client.address && <p className="text-gray-600 mt-1">{delivery.order.client.address}</p>}
          {delivery.order.client.city && <p className="text-gray-600">{delivery.order.client.city}</p>}
          {delivery.order.client.phone && <p className="text-gray-500 text-xs mt-1">Tél: {delivery.order.client.phone}</p>}
          {delivery.order.client.rc && <p className="text-gray-500 text-xs">RC: {delivery.order.client.rc}</p>}
          {delivery.order.client.nif && <p className="text-gray-500 text-xs">NIF: {delivery.order.client.nif}</p>}
        </div>
        <div className="border border-gray-200 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Détails livraison</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date livraison:</span>
            <span className="font-medium">{format(new Date(delivery.deliveryDate), 'dd MMMM yyyy', { locale: fr })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Ref. commande:</span>
            <span className="font-medium font-mono">{delivery.order.orderNumber}</span>
          </div>
          {delivery.carrierName && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Transporteur:</span>
              <span className="font-medium">{delivery.carrierName}</span>
            </div>
          )}
          {delivery.trackingNumber && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">N° tracking:</span>
              <span className="font-mono">{delivery.trackingNumber}</span>
            </div>
          )}
          <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
            <span className="text-gray-500">Statut:</span>
            <span className={`font-semibold ${delivery.status === 'SIGNE' ? 'text-green-600' : 'text-blue-600'}`}>
              {delivery.status === 'SIGNE' ? 'Signé' : delivery.status === 'LIVRE' ? 'Livré' : delivery.status}
            </span>
          </div>
        </div>
      </div>

      {/* Tableau articles */}
      <table className="w-full border-collapse mb-8">
        <thead>
          <tr className="bg-primary-700 text-white">
            <th className="py-3 px-4 text-left text-xs font-semibold uppercase">Réf. Modèle</th>
            <th className="py-3 px-4 text-left text-xs font-semibold uppercase">Désignation</th>
            <th className="py-3 px-4 text-left text-xs font-semibold uppercase">Coloris</th>
            <th className="py-3 px-4 text-left text-xs font-semibold uppercase">Répartition tailles</th>
            <th className="py-3 px-4 text-right text-xs font-semibold uppercase">Qté</th>
          </tr>
        </thead>
        <tbody>
          {delivery.lines.map((line, idx) => {
            const sizes = Object.entries(line.sizeBreakdown || {}).filter(([, q]) => q > 0);
            return (
              <tr key={line.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="py-3 px-4 font-mono text-xs text-gray-600">{line.model.code || '—'}</td>
                <td className="py-3 px-4 font-medium">{line.model.name}</td>
                <td className="py-3 px-4 text-gray-600">{line.colorRef || '—'}</td>
                <td className="py-3 px-4 text-xs text-gray-500">
                  {sizes.length > 0
                    ? sizes.map(([s, q]) => `${s}:${q}`).join(' | ')
                    : '—'}
                </td>
                <td className="py-3 px-4 text-right font-bold">{line.quantity}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-primary-50 border-t-2 border-primary-200">
            <td colSpan={4} className="py-3 px-4 font-semibold text-right text-primary-700">TOTAL PIÈCES</td>
            <td className="py-3 px-4 text-right font-bold text-xl text-primary-700">{totalQty}</td>
          </tr>
        </tfoot>
      </table>

      {/* Notes */}
      {delivery.notes && (
        <div className="mb-8 p-4 border border-gray-200 rounded-xl">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Observations</p>
          <p className="text-sm text-gray-700">{delivery.notes}</p>
        </div>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-12 mt-12">
        <div className="text-center">
          <div className="h-16 border-b-2 border-gray-300 mb-2" />
          <p className="text-xs text-gray-500 font-medium uppercase">Signature Livreur</p>
          <p className="text-xs text-gray-400">Nom & Cachet</p>
        </div>
        <div className="text-center">
          <div className="h-16 border-b-2 border-gray-300 mb-2" />
          <p className="text-xs text-gray-500 font-medium uppercase">Signature Client</p>
          <p className="text-xs text-gray-400">Nom, Cachet & Date</p>
        </div>
      </div>

      {/* Pied de page */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">Document généré le {format(new Date(), 'dd/MM/yyyy à HH:mm')} — CoutureGest</p>
      </div>
    </div>
  );
}
