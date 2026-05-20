import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../lib/api';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('jamit_token');
    const u = localStorage.getItem('jamit_user');
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
    }
    setIsLoading(false);
  }, []);

  const persist = (accessToken: string, userData: User) => {
    localStorage.setItem('jamit_token', accessToken);
    localStorage.setItem('jamit_user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  };

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    persist(data.accessToken, data.user);
  };

  const register = async (email: string, password: string, displayName: string) => {
    const { data } = await authApi.register({ email, password, displayName });
    persist(data.accessToken, data.user);
  };

  const logout = () => {
    localStorage.removeItem('jamit_token');
    localStorage.removeItem('jamit_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
