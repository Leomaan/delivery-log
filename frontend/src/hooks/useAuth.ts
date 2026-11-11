import { useCallback, useEffect, useState } from 'react';
import { httpClient } from '../lib/httpClient';
import type { AuthUser } from '../types/domain';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const res = await httpClient.post<{ user: AuthUser }>('/auth/refresh');
        setUser(res.user);
      } catch {
        setUser(null);
      } finally {
        setInitializing(false);
      }
    }
    void restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    httpClient.invalidateCache();
    const res = await httpClient.post<{ user: AuthUser }>('/auth/login', {
      email,
      password,
    });
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await httpClient.post<unknown>('/auth/logout');
    } finally {
      httpClient.setAccessToken(null);
      httpClient.invalidateCache();
      setUser(null);
    }
  }, []);

  return {
    user,
    initializing,
    login,
    logout,
  };
}
