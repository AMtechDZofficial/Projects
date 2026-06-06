import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, Scissors, Factory, CreditCard,
  Package, Users, Printer, ChevronRight, Download, Truck, Receipt
} from 'lucide-react';
import PrintModal from '../components/print/PrintModal';
import FicheTechniqueModele from '../components/print/FicheTechniqueModele';
import FicheDeCoupe from '../components/print/FicheDeCoupe';
import OrdreDefabrication from '../components/print/OrdreDefabrication';
import BulletinDePaie from '../components/print/BulletinDePaie';
import BonMouvement from '../components/print/BonMouvement';
import FicheOperateur from '../components/print/FicheOperateur';
import BonDeLivraison from '../components/print/BonDeLivraison';
import FactureClient from '../components/print/FactureClient';
import { modelsApi, productionApi, payrollApi, employeesApi, deliveriesApi, invoicesApi } from '../services/api';
import { CoutureModel, ProductionOrder, Payroll, Employee, Delivery, Invoice } from '../types';
import { format } from 'date-fns';

type PrintState =
  | { type: 'fiche-technique'; modelId: string }
  | { type: 'fiche-coupe'; orderId: string }
  | { type: 'ordre-fab'; orderId: string }
  | { type: 'bulletin'; payroll: Payroll }
  | { type: 'bon-entree' }
  | { type: 'bon-sortie' }
  | { type: 'fiche-operateur'; employeeId: string }
  | { type: 'bon-livraison'; deliveryId: string }
  | { type: 'facture-client'; invoiceId: string }
  | null;

const FORM_TYPES = [
  {
    id: 'fiche-technique',
    title: 'Fiche Technique Modèle',
    description: 'Nomenclature complète, gamme opératoire, coûts calculés automatiquement',
    icon: Scissors,
    color: 'bg-purple-50 border-purple-200 hover:border-purple-400',
    iconColor: 'text-purple-600',
    badge: 'Modèles'
  },
  {
    id: 'fiche-coupe',
    title: 'Fiche de Coupe',
    description: 'Plan de coupe, répartition tailles/coloris, consommation tissu, contrôle qualité',
    icon: Scissors,
    color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    iconColor: 'text-blue-600',
    badge: 'Production'
  },
  {
    id: 'ordre-fab',
    title: 'Ordre de Fabrication',
    description: 'Suivi complet des opérations, sorties matières, avancement et signatures',
    icon: Factory,
    color: 'bg-orange-50 border-orange-200 hover:border-orange-400',
    iconColor: 'text-orange-600',
    badge: 'Production'
  },
  {
    id: 'bulletin',
    title: 'Bulletin de Paie',
    description: 'Bulletin officiel avec détail gains (pièce/chaîne), retenues CNAS, net à payer',
    icon: CreditCard,
    color: 'bg-green-50 border-green-200 hover:border-green-400',
    iconColor: 'text-green-600',
    badge: 'Paie'
  },
  {
    id: 'bon-entree',
    title: 'Bon de Réception (Entrée)',
    description: 'Réception matières premières du fournisseur avec contrôle qualité à la réception',
    icon: Package,
    color: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
    iconColor: 'text-emerald-600',
    badge: 'Stock'
  },
  {
    id: 'bon-sortie',
    title: 'Bon de Sortie Matières',
    description: 'Sortie matières vers production, lié à un ordre de fabrication',
    icon: Package,
    color: 'bg-red-50 border-red-200 hover:border-red-400',
    iconColor: 'text-red-600',
    badge: 'Stock'
  },
  {
    id: 'fiche-operateur',
    title: 'Fiche Opérateur Hebdomadaire',
    description: 'Présences, production journalière, récapitulatif gains à la pièce/chaîne',
    icon: Users,
    color: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400',
    iconColor: 'text-indigo-600',
    badge: 'Employés'
  },
  {
    id: 'bon-livraison',
    title: 'Bon de Livraison',
    description: 'BL client avec articles livrés, répartition tailles, transporteur et bloc signature',
    icon: Truck,
    color: 'bg-cyan-50 border-cyan-200 hover:border-cyan-400',
    iconColor: 'text-cyan-600',
    badge: 'Commercial'
  },
  {
    id: 'facture-client',
    title: 'Facture Client',
    description: 'Facture officielle avec TVA 19%, timbre fiscal, conditions paiement et mentions légales',
    icon: Receipt,
    color: 'bg-teal-50 border-teal-200 hover:border-teal-400',
    iconColor: 'text-teal-600',
    badge: 'Commercial'
  }
];

// ─── Sélecteurs ──────────────────────────────────────────────────────────────

function ModelSelector({ onSelect }: { onSelect: (id: string) => void }) {
  const { data: models = [] } = useQuery<CoutureModel[]>({
    queryKey: ['models'],
    queryFn: () => modelsApi.getAll().then(r => r.data)
  });
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Choisir le modèle :</p>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {models.map(m => (
          <button key={m.id} onClick={() => onSelect(m.id)}
            className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-colors flex items-center justify-between">
            <div>
              <span className="font-mono text-xs text-gray-400 mr-2">{m.code}</span>
              <span className="font-medium">{m.name}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        ))}
        {models.length === 0 && <p className="text-center text-gray-400 py-6">Aucun modèle disponible</p>}
      </div>
    </div>
  );
}

function OrderSelector({ onSelect }: { onSelect: (id: string) => void }) {
  const { data: orders = [] } = useQuery<ProductionOrder[]>({
    queryKey: ['orders'],
    queryFn: () => productionApi.getOrders().then(r => r.data)
  });
  const statusColors = { EN_ATTENTE: 'text-yellow-600', EN_COURS: 'text-blue-600', TERMINE: 'text-green-600', ANNULE: 'text-red-500' };
  const statusLabels = { EN_ATTENTE: 'En attente', EN_COURS: 'En cours', TERMINE: 'Terminé', ANNULE: 'Annulé' };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Choisir l'ordre de fabrication :</p>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {orders.map(o => (
          <button key={o.id} onClick={() => onSelect(o.id)}
            className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-colors flex items-center justify-between">
            <div>
              <span className="font-mono font-semibold text-sm text-gray-700 mr-3">{o.orderNumber}</span>
              <span className="text-sm text-gray-600">{o.model.name}</span>
              <span className="ml-2 text-sm font-semibold">× {o.quantity}</span>
            </div>
            <span className={`text-xs font-medium ${statusColors[o.status]}`}>{statusLabels[o.status]}</span>
          </button>
        ))}
        {orders.length === 0 && <p className="text-center text-gray-400 py-6">Aucun ordre disponible</p>}
      </div>
    </div>
  );
}

function PayrollSelector({ onSelect }: { onSelect: (p: Payroll) => void }) {
  const { data: payrolls = [] } = useQuery<Payroll[]>({
    queryKey: ['payrolls'],
    queryFn: () => payrollApi.getAll().then(r => r.data)
  });
  const statusColors = { BROUILLON: 'text-yellow-600', VALIDE: 'text-blue-600', PAYE: 'text-green-600' };
  const statusLabels = { BROUILLON: 'Brouillon', VALIDE: 'Validé', PAYE: 'Payé' };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Choisir le bulletin de paie :</p>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {payrolls.map(p => (
          <button key={p.id} onClick={() => onSelect(p)}
            className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-colors flex items-center justify-between">
            <div>
              <span className="font-medium">{p.employee.lastName} {p.employee.firstName}</span>
              <span className="ml-2 text-xs text-gray-400">{p.employee.employeeId}</span>
              <span className="ml-2 text-sm text-gray-500">
                — {format(new Date(p.periodStart), 'MM/yyyy')}
              </span>
            </div>
            <div className="text-right">
              <div className={`text-xs font-medium ${statusColors[p.status]}`}>{statusLabels[p.status]}</div>
              <div className="text-xs font-semibold text-gray-700">{Number(p.totalAmount).toLocaleString('fr-DZ')} DZD</div>
            </div>
          </button>
        ))}
        {payrolls.length === 0 && <p className="text-center text-gray-400 py-6">Aucun bulletin disponible</p>}
      </div>
    </div>
  );
}

function EmployeeSelector({ onSelect }: { onSelect: (id: string) => void }) {
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: () => employeesApi.getAll().then(r => r.data)
  });
  const payTypeLabel: Record<string, string> = { PIECE: 'Pièce', CHAINE: 'Chaîne', HORAIRE: 'Horaire', MENSUEL: 'Mensuel' };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Choisir l'opérateur :</p>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {employees.map(e => (
          <button key={e.id} onClick={() => onSelect(e.id)}
            className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-colors flex items-center justify-between">
            <div>
              <span className="font-mono text-xs text-gray-400 mr-2">{e.employeeId}</span>
              <span className="font-medium">{e.firstName} {e.lastName}</span>
              <span className="ml-2 text-xs text-gray-500">{e.position}</span>
            </div>
            <span className="text-xs text-primary-600 font-medium">{payTypeLabel[e.paymentType]}</span>
          </button>
        ))}
        {employees.length === 0 && <p className="text-center text-gray-400 py-6">Aucun employé disponible</p>}
      </div>
    </div>
  );
}

function DeliverySelector({ onSelect }: { onSelect: (id: string) => void }) {
  const { data: deliveries = [] } = useQuery<Delivery[]>({
    queryKey: ['deliveries'],
    queryFn: () => deliveriesApi.getAll().then(r => r.data)
  });
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Choisir le bon de livraison :</p>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {deliveries.map(d => (
          <button key={d.id} onClick={() => onSelect(d.id)}
            className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-colors flex items-center justify-between">
            <div>
              <span className="font-mono font-semibold text-sm text-gray-700 mr-3">{d.deliveryNumber}</span>
              <span className="text-sm text-gray-600">{d.order.client.name}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        ))}
        {deliveries.length === 0 && <p className="text-center text-gray-400 py-6">Aucun BL disponible</p>}
      </div>
    </div>
  );
}

function InvoiceSelector({ onSelect }: { onSelect: (id: string) => void }) {
  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: () => invoicesApi.getAll().then(r => r.data)
  });
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Choisir la facture :</p>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {invoices.map(inv => (
          <button key={inv.id} onClick={() => onSelect(inv.id)}
            className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-colors flex items-center justify-between">
            <div>
              <span className="font-mono font-semibold text-sm text-gray-700 mr-3">{inv.invoiceNumber}</span>
              <span className="text-sm text-gray-600">{inv.client.name}</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-primary-600">{Number(inv.totalAmount).toLocaleString('fr-DZ')} DZD</span>
            </div>
          </button>
        ))}
        {invoices.length === 0 && <p className="text-center text-gray-400 py-6">Aucune facture disponible</p>}
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function Forms() {
  const [printState, setPrintState] = useState<PrintState>(null);
  const [selectorType, setSelectorType] = useState<string | null>(null);

  const handleCardClick = (formId: string) => {
    if (formId === 'bon-entree') { setPrintState({ type: 'bon-entree' }); return; }
    if (formId === 'bon-sortie') { setPrintState({ type: 'bon-sortie' }); return; }
    setSelectorType(formId);
  };

  const renderSelector = () => {
    if (!selectorType) return null;
    switch (selectorType) {
      case 'fiche-technique': return <ModelSelector onSelect={id => { setPrintState({ type: 'fiche-technique', modelId: id }); setSelectorType(null); }} />;
      case 'fiche-coupe': return <OrderSelector onSelect={id => { setPrintState({ type: 'fiche-coupe', orderId: id }); setSelectorType(null); }} />;
      case 'ordre-fab': return <OrderSelector onSelect={id => { setPrintState({ type: 'ordre-fab', orderId: id }); setSelectorType(null); }} />;
      case 'bulletin': return <PayrollSelector onSelect={p => { setPrintState({ type: 'bulletin', payroll: p }); setSelectorType(null); }} />;
      case 'fiche-operateur': return <EmployeeSelector onSelect={id => { setPrintState({ type: 'fiche-operateur', employeeId: id }); setSelectorType(null); }} />;
      case 'bon-livraison': return <DeliverySelector onSelect={id => { setPrintState({ type: 'bon-livraison', deliveryId: id }); setSelectorType(null); }} />;
      case 'facture-client': return <InvoiceSelector onSelect={id => { setPrintState({ type: 'facture-client', invoiceId: id }); setSelectorType(null); }} />;
      default: return null;
    }
  };

  const getPrintTitle = () => {
    if (!printState) return '';
    const titles: Record<string, string> = {
      'fiche-technique': 'Fiche Technique Modèle',
      'fiche-coupe': 'Fiche de Coupe',
      'ordre-fab': 'Ordre de Fabrication',
      'bulletin': 'Bulletin de Paie',
      'bon-entree': 'Bon de Réception Matières',
      'bon-sortie': 'Bon de Sortie Matières',
      'fiche-operateur': 'Fiche Opérateur',
      'bon-livraison': 'Bon de Livraison',
      'facture-client': 'Facture Client'
    };
    return titles[printState.type] || '';
  };

  const renderPrintContent = () => {
    if (!printState) return null;
    switch (printState.type) {
      case 'fiche-technique': return <FicheTechniqueModele modelId={printState.modelId} />;
      case 'fiche-coupe': return <FicheDeCoupe orderId={printState.orderId} />;
      case 'ordre-fab': return <OrdreDefabrication orderId={printState.orderId} />;
      case 'bulletin': return <BulletinDePaie payroll={printState.payroll} />;
      case 'bon-entree': return <BonMouvement type="ENTREE" />;
      case 'bon-sortie': return <BonMouvement type="SORTIE" />;
      case 'fiche-operateur': return <FicheOperateur employeeId={printState.employeeId} />;
      case 'bon-livraison': return <BonDeLivraison deliveryId={printState.deliveryId} />;
      case 'facture-client': return <FactureClient invoiceId={printState.invoiceId} />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Formulaires & Documents Imprimables</h2>
        <p className="text-gray-500 text-sm mt-1">Cliquez sur un formulaire pour le générer et l'imprimer au format A4</p>
      </div>

      {/* Catalogue formulaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FORM_TYPES.map(form => {
          const Icon = form.icon;
          return (
            <button
              key={form.id}
              onClick={() => handleCardClick(form.id)}
              className={`text-left p-5 rounded-xl border-2 transition-all ${form.color} group`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 group-hover:shadow-md transition-shadow`}>
                  <Icon className={`w-6 h-6 ${form.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{form.title}</span>
                    <span className="text-xs px-2 py-0.5 bg-white rounded-full text-gray-500 font-medium border border-gray-200">{form.badge}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{form.description}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold">
                <Printer className={`w-3.5 h-3.5 ${form.iconColor}`} />
                <span className={form.iconColor}>Générer & Imprimer</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info */}
      <div className="card p-5 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 text-sm">Formats disponibles</h3>
            <p className="text-xs text-blue-700 mt-1">
              Tous les formulaires sont au format A4, optimisés pour l'impression.
              Les données sont pré-remplies automatiquement depuis la base de données.
              Utilisez Ctrl+P ou le bouton "Imprimer" après avoir sélectionné le document.
            </p>
          </div>
        </div>
      </div>

      {/* Sélecteur modal */}
      {selectorType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectorType(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4 text-lg">
              {FORM_TYPES.find(f => f.id === selectorType)?.title}
            </h3>
            {renderSelector()}
            <button onClick={() => setSelectorType(null)} className="mt-4 w-full btn-secondary justify-center">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Vue impression */}
      <PrintModal
        isOpen={!!printState}
        onClose={() => setPrintState(null)}
        title={getPrintTitle()}
      >
        {renderPrintContent()}
      </PrintModal>
    </div>
  );
}
