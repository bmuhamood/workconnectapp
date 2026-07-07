// hooks/useAuth.tsx
'use client';

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosInstance } from 'axios';
import { supabase } from '@/lib/supabase/client';
import { loginWithPassword, logoutUser } from '@/lib/supabase/authService';
import type { Session } from '@supabase/supabase-js';

const legacyApi: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  role: 'employer' | 'worker' | 'admin' | 'super_admin';
  status: string;
  is_verified: boolean;
  email_verified: boolean;
  phone_verified: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  token: string | null; // kept for pages/hooks that still read a bearer token
  login: (credentials: { email: string; password: string }, redirectTo?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
  refreshUser: () => Promise<AuthUser | null>;
  /**
   * @deprecated Legacy axios instance kept only so hooks not yet migrated to
   * Supabase (useDashboard, useInvoices) still compile. It still points at
   * the old Django API — migrate the hook, then delete this.
   */
  api: AxiosInstance;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

async function fetchProfile(userId: string): Promise<AuthUser | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) return null;
  return data as unknown as AuthUser;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        const profile = await fetchProfile(data.session.user.id);
        setUser(profile);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        const profile = await fetchProfile(newSession.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: { email: string; password: string }, redirectTo?: string) => {
    setLoading(true);
    try {
      const { user: profile, session: newSession } = await loginWithPassword(credentials.email, credentials.password);
      setUser(profile as unknown as AuthUser);
      if (newSession?.access_token) {
        legacyApi.defaults.headers.common.Authorization = `Bearer ${newSession.access_token}`;
      }
      router.push(redirectTo || '/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setSession(null);
    router.push('/login');
  };

  const isAuthenticated = () => !!user && !!session;

  const refreshUser = async () => {
    if (!session?.user) return null;
    const profile = await fetchProfile(session.user.id);
    setUser(profile);
    return profile;
  };

  const value: AuthContextValue = {
    user,
    loading,
    token: session?.access_token ?? null,
    login,
    logout,
    isAuthenticated,
    refreshUser,
    api: legacyApi,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
