import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Scissors, Factory, Warehouse,
  Users, CreditCard, Calculator, ChevronRight, FileText,
  Settings, GitBranch, Bot, Building2, ShoppingBag, Truck,
  Receipt, CalendarCheck, Calendar, ShieldCheck
} from 'lucide-react';

const navGroups = [
  {
    label: null,
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' }
    ]
  },
  {
    label: 'Commercial',
    items: [
      { to: '/clients', icon: Building2, label: 'Clients' },
      { to: '/commandes', icon: ShoppingBag, label: 'Commandes' },
      { to: '/livraisons', icon: Truck, label: 'Livraisons' },
      { to: '/factures', icon: Receipt, label: 'Factures' }
    ]
  },
  {
    label: 'Atelier',
    items: [
      { to: '/materials', icon: Package, label: 'Matières premières' },
      { to: '/models', icon: Scissors, label: 'Modèles' },
      { to: '/production', icon: Factory, label: 'Production' },
      { to: '/planning', icon: Calendar, label: 'Planning' },
      { to: '/qualite', icon: ShieldCheck, label: 'Qualité' },
      { to: '/stock', icon: Warehouse, label: 'Stock' },
      { to: '/machines', icon: Settings, label: 'Machines' },
      { to: '/line-balance', icon: GitBranch, label: 'Équilibrage ligne' }
    ]
  },
  {
    label: 'Ressources Humaines',
    items: [
      { to: '/employees', icon: Users, label: 'Employés' },
      { to: '/presences', icon: CalendarCheck, label: 'Présences' },
      { to: '/payroll', icon: CreditCard, label: 'Paie' }
    ]
  },
  {
    label: 'Analyse & Outils',
    items: [
      { to: '/costs', icon: Calculator, label: 'Coûts & Analyses' },
      { to: '/forms', icon: FileText, label: 'Formulaires' },
      { to: '/ai-agent', icon: Bot, label: 'Agent IA' }
    ]
  }
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">CoutureGest</h1>
            <p className="text-xs text-gray-500">Gestion Atelier</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 overflow-y-auto">
        {navGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
            {group.label && (
              <p className="px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">{group.label}</p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                      <span className="flex-1">{label}</span>
                      {isActive && <ChevronRight className="w-3 h-3 text-primary-400" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">v2.0.0 © 2026</p>
      </div>
    </aside>
  );
}
