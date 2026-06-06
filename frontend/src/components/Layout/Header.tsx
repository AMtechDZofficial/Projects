import { Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

const titles: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/materials': 'Matières Premières',
  '/models': 'Modèles de Vêtements',
  '/production': 'Production',
  '/stock': 'Gestion du Stock',
  '/employees': 'Employés',
  '/payroll': 'Paie',
  '/costs': 'Coûts & Analyses'
};

export default function Header() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-800">{titles[pathname] || 'CoutureGest'}</h2>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary-600" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-700">{user?.name}</p>
            <p className="text-xs text-gray-400">{user?.role}</p>
          </div>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
