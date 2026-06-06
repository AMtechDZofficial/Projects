import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, WorkshopConfig } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  config: WorkshopConfig | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshConfig: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<WorkshopConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authApi.me().then(res => {
        setUser(res.data.user);
        setConfig(res.data.config);
      }).catch(() => {
        localStorage.removeItem('token');
      }).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    const meRes = await authApi.me();
    setConfig(meRes.data.config);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setConfig(null);
  };

  const refreshConfig = async () => {
    const res = await authApi.me();
    setConfig(res.data.config);
  };

  return (
    <AuthContext.Provider value={{ user, config, isLoading, login, logout, refreshConfig }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
