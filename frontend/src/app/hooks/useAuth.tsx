import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { User } from '../../api/types';
import { login as apiLogin, logout as apiLogout, register as apiRegister, refreshToken as apiRefreshToken } from '../../api/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (data: any) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(() => {
    const raw = localStorage.getItem('user');
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (username: string, password: string) => {
    const res = await apiLogin(username, password);
    if (res.ok && res.user) {
      setUser(res.user);
      return { ok: true };
    }
    return { ok: false, error: res.error };
  };

  const register = async (data: any) => {
    const res = await apiRegister(data);
    if (res.ok) {
      // Don't login user yet - they must verify email first
      // Just show success message and redirect to email verification
      return { ok: true };
    }
    return { ok: false, error: res.error };
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  const refresh = async () => {
    const success = await apiRefreshToken();
    if (success) {
      loadUser();
    } else {
      setUser(null);
    }
    return success;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
