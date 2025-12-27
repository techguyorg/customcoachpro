import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User } from '@/types';
import authService from '@/services/authService';
import apiService from '@/services/api';

const REFRESH_BUFFER_MS = 60_000;

function getTokenExpiry(token: string | null): number | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const payload = JSON.parse(atob(parts[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, firstName: string, lastName: string, role: 'coach' | 'client') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimeoutRef = useRef<number | null>(null);

  const clearScheduledRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    clearScheduledRefresh();
    await authService.logout();
    setUser(null);
    window.location.href = '/login';
  }, [clearScheduledRefresh]);

  const performRefresh = useCallback(async (): Promise<string | null> => {
    try {
      const response = await authService.refreshToken();
      if (response.user) {
        setUser(response.user);
      }
      return response.token;
    } catch {
      return null;
    }
  }, []);

  const scheduleBackgroundRefresh = useCallback(
    (token: string | null) => {
      clearScheduledRefresh();

      const expiresAt = getTokenExpiry(token);
      if (!expiresAt) return;

      const delay = Math.max(expiresAt - Date.now() - REFRESH_BUFFER_MS, 0);

      refreshTimeoutRef.current = window.setTimeout(async () => {
        const refreshedToken = await performRefresh();
        if (refreshedToken) {
          scheduleBackgroundRefresh(refreshedToken);
          return;
        }

        await handleLogout();
      }, delay);
    },
    [clearScheduledRefresh, performRefresh, handleLogout]
  );

  useEffect(() => {
    apiService.setRefreshHandler(async () => {
      const refreshedToken = await performRefresh();
      if (refreshedToken) {
        scheduleBackgroundRefresh(refreshedToken);
      }
      return refreshedToken;
    });

    apiService.setLogoutHandler(handleLogout);
  }, [handleLogout, performRefresh, scheduleBackgroundRefresh]);

  useEffect(() => {
    const init = async () => {
      const storedUser = authService.getStoredUser();
      const token = localStorage.getItem('auth_token');

      if (storedUser && token) {
        setUser(storedUser);
        scheduleBackgroundRefresh(token);
        try {
          const me = await authService.getCurrentUser();
          setUser(me);
        } catch {
          await handleLogout();
        }
      }

      setIsLoading(false);
    };

    init();
    return () => {
      clearScheduledRefresh();
    };
  }, [clearScheduledRefresh, handleLogout, scheduleBackgroundRefresh]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setUser(response.user);
    scheduleBackgroundRefresh(response.token);
    return response.user;
  }, [scheduleBackgroundRefresh]);

  const register = useCallback(async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: 'coach' | 'client'
  ) => {
    const response = await authService.register({ email, password, firstName, lastName, role });
    setUser(response.user);
    scheduleBackgroundRefresh(response.token);
  }, [scheduleBackgroundRefresh]);

  const logout = useCallback(async () => {
    await handleLogout();
  }, [handleLogout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
