'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Society, SocietyMembership } from '@/types';

interface AuthContextType {
  user: User | null;
  society: Society | null;
  membership: SocietyMembership | null;
  activePersona: string; // 'usr-offerer-001' | 'usr-seeker-001' | 'usr-admin-001'
  switchPersona: (userId: string) => void;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  society: null,
  membership: null,
  activePersona: 'usr-offerer-001',
  switchPersona: () => {},
  isLoading: true,
  refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [activePersona, setActivePersona] = useState<string>('usr-offerer-001'); // Ashutosh Dixit default
  const [user, setUser] = useState<User | null>(null);
  const [society, setSociety] = useState<Society | null>(null);
  const [membership, setMembership] = useState<SocietyMembership | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAuth = async (personaId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/auth/me', {
        headers: {
          'x-dev-user-id': personaId,
          'x-society-id': 'soc-ggh-001',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setSociety(data.society);
        setMembership(data.membership);
      }
    } catch (e) {
      console.error('Failed to load user', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuth(activePersona);
  }, [activePersona]);

  const switchPersona = (userId: string) => {
    setActivePersona(userId);
  };

  const refreshAuth = async () => {
    await fetchAuth(activePersona);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        society,
        membership,
        activePersona,
        switchPersona,
        isLoading,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
