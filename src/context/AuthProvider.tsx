import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { ApiError } from '@/api/client';
import { fetchMeApi, loginApi, logoutApi, signupApi, type SignupPayload } from '@/api/auth';
import { LoginPage } from '@/pages/LoginPage';
import type { AuthUser } from '@/types';

interface AuthContextValue {
  user: AuthUser;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const me = await fetchMeApi();
        if (!cancelled) setUser(me);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          setUser(null);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to reach the API');
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const me = await loginApi(email, password);
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
  }, []);

  const signup = useCallback(async (payload: SignupPayload) => {
    const me = await signupApi(payload);
    setUser(me);
  }, []);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-gray-600">
        Loading application data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white px-6 text-center text-sm text-gray-600">
        <p className="font-medium text-gray-900">Unable to connect to the API</p>
        <p>{error}</p>
        <p className="text-xs text-gray-500">
          Ensure PostgreSQL is running and the backend server is started on port 3001.
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={login} onSignup={signup} />;
  }

  return <AuthContext.Provider value={{ user, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
