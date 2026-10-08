'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Society, SocietyMembership } from '@/types';

interface AuthContextType {
  user: User | null;
  society: Society | null;
  societiesList: Society[];
  membership: SocietyMembership | null;
  activePersona: string; // 'usr-offerer-001' | 'usr-seeker-001' | 'usr-admin-001' | 'usr-app-admin-001'
  activeSocietyId: string;
  isAuthenticated: boolean;
  switchPersona: (userId: string) => void;
  switchSociety: (societyId: string) => void;
  updateCommuteIntent: (intent: 'OFFERER' | 'SEEKER' | 'BOTH') => Promise<void>;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  society: null,
  societiesList: [],
  membership: null,
  activePersona: 'usr-offerer-001',
  activeSocietyId: 'soc-ggh-001',
  isAuthenticated: false,
  switchPersona: () => {},
  switchSociety: () => {},
  updateCommuteIntent: async () => {},
  isLoading: true,
  refreshAuth: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [activePersona, setActivePersona] = useState<string>('usr-offerer-001'); // Ashutosh Dixit default
  const [activeSocietyId, setActiveSocietyId] = useState<string>('soc-ggh-001');
  const [user, setUser] = useState<User | null>(null);
  const [society, setSociety] = useState<Society | null>(null);
  const [societiesList, setSocietiesList] = useState<Society[]>([]);
  const [membership, setMembership] = useState<SocietyMembership | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSocieties = async () => {
    try {
      const res = await fetch('/api/v1/societies');
      if (res.ok) {
        const data = await res.json();
        setSocietiesList(data.societies || []);
      }
    } catch (e) {
      console.error('Failed to load societies list', e);
    }
  };

  const fetchAuth = async (personaId: string, societyId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/auth/me', {
        headers: {
          'x-dev-user-id': personaId,
          'x-society-id': societyId,
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
    fetchSocieties();
  }, []);

  useEffect(() => {
    fetchAuth(activePersona, activeSocietyId);
  }, [activePersona, activeSocietyId]);

  const switchPersona = (userId: string) => {
    setActivePersona(userId);
  };

  const switchSociety = (societyId: string) => {
    setActiveSocietyId(societyId);
  };

  const updateCommuteIntent = async (intent: 'OFFERER' | 'SEEKER' | 'BOTH') => {
    if (!user) return;
    setUser({ ...user, commuteIntent: intent });
    // In production, syncs to DB/API
  };

  const refreshAuth = async () => {
    await fetchAuth(activePersona, activeSocietyId);
  };

  const [isLoggedOut, setIsLoggedOut] = useState<boolean>(false);

  // In demo/localhost without active cookie, user can be simulated or logged out
  const isAuthenticated = !isLoggedOut && Boolean(user);

  const logout = async () => {
    try {
      await fetch('/api/v1/auth/session', { method: 'DELETE' });
    } catch (e) {
      console.warn('Logout fetch note:', e);
    }
    setUser(null);
    setMembership(null);
    setIsLoggedOut(true);
    localStorage.setItem('societyapps_logged_out', 'true');
  };

  const loginSuccess = () => {
    setIsLoggedOut(false);
    localStorage.removeItem('societyapps_logged_out');
    fetchAuth(activePersona, activeSocietyId);
  };

  useEffect(() => {
    const loggedOut = localStorage.getItem('societyapps_logged_out') === 'true';
    if (loggedOut) {
      setIsLoggedOut(true);
      setUser(null);
      setMembership(null);
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        society,
        societiesList,
        membership,
        activePersona,
        activeSocietyId,
        isAuthenticated,
        switchPersona,
        switchSociety,
        updateCommuteIntent,
        isLoading,
        refreshAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
