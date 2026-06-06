import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Scissors, Factory, Warehouse,
  Users, CreditCard, Calculator, ChevronRight, FileText
} from 'lucide-react';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/materials', icon: Package, label: 'Matières premières' },
  { to: '/models', icon: Scissors, label: 'Modèles' },
  { to: '/production', icon: Factory, label: 'Production' },
  { to: '/stock', icon: Warehouse, label: 'Stock' },
  { to: '/employees', icon: Users, label: 'Employés' },
  { to: '/payroll', icon: CreditCard, label: 'Paie' },
  { to: '/costs', icon: Calculator, label: 'Coûts & Analyses' },
  { to: '/forms', icon: FileText, label: 'Formulaires' }
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
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
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
      </nav>
      <div className="p-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">v1.0.0 © 2026</p>
      </div>
    </aside>
  );
}
