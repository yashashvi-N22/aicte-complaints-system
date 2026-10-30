import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  quickSwitchRole: (target: 'admin' | 'reviewer' | 'officer_approval' | 'officer_faculty' | 'rep_delhi' | 'rep_mumbai') => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    try {
      const u = await api.getCurrentUser();
      setUser(u);
    } catch {
      setUser(null);
      api.logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('aicte_auth_token');
    if (token) {
      refreshProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.login(username, password);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  const quickSwitchRole = async (target: 'admin' | 'reviewer' | 'officer_approval' | 'officer_faculty' | 'rep_delhi' | 'rep_mumbai') => {
    const credentialsMap: Record<string, { u: string; p: string }> = {
      admin: { u: 'admin', p: 'Aicte@Portal2026' },
      reviewer: { u: 'reviewer_singh', p: 'Aicte@Portal2026' },
      officer_approval: { u: 'officer_approval', p: 'Aicte@Portal2026' },
      officer_faculty: { u: 'officer_faculty', p: 'Aicte@Portal2026' },
      rep_delhi: { u: 'rep_delhi', p: 'Aicte@Portal2026' },
      rep_mumbai: { u: 'rep_mumbai', p: 'Aicte@Portal2026' },
    };

    const cred = credentialsMap[target];
    if (cred) {
      await login(cred.u, cred.p);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        quickSwitchRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
