import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import Models from './pages/Models';
import Production from './pages/Production';
import Stock from './pages/Stock';
import Employees from './pages/Employees';
import Payroll from './pages/Payroll';
import Costs from './pages/Costs';
import Forms from './pages/Forms';
import Machines from './pages/Machines';
import LineBalance from './pages/LineBalance';
import AIAgent from './pages/AIAgent';
import Clients from './pages/Clients';
import ClientOrders from './pages/ClientOrders';
import Deliveries from './pages/Deliveries';
import Invoices from './pages/Invoices';
import Attendance from './pages/Attendance';
import Planning from './pages/Planning';
import Quality from './pages/Quality';

function AppRoutes() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;
  if (!user) return <Routes><Route path="*" element={<LoginPage />} /></Routes>;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/commandes" element={<ClientOrders />} />
        <Route path="/livraisons" element={<Deliveries />} />
        <Route path="/factures" element={<Invoices />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/models" element={<Models />} />
        <Route path="/production" element={<Production />} />
        <Route path="/planning" element={<Planning />} />
        <Route path="/qualite" element={<Quality />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/presences" element={<Attendance />} />
        <Route path="/payroll" element={<Payroll />} />
        <Route path="/costs" element={<Costs />} />
        <Route path="/machines" element={<Machines />} />
        <Route path="/line-balance" element={<LineBalance />} />
        <Route path="/forms" element={<Forms />} />
        <Route path="/ai-agent" element={<AIAgent />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
