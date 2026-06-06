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

function AppRoutes() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;
  if (!user) return <Routes><Route path="*" element={<LoginPage />} /></Routes>;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/models" element={<Models />} />
        <Route path="/production" element={<Production />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/payroll" element={<Payroll />} />
        <Route path="/costs" element={<Costs />} />
        <Route path="/forms" element={<Forms />} />
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
