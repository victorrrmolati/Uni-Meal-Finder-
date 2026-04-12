// ============================================================
//  src/contexts/AuthContext.tsx
//  Replace your entire existing AuthContext with this.
// ============================================================

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiFetch, setToken, removeToken, getToken } from '../lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'staff' | 'vendor';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name?: string, role?: string) => Promise<{ error: any }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On app load, check if a token is already saved and restore the session
  useEffect(() => {
    const token = getToken();
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message } };
    }
  };

  const signUp = async (email: string, password: string, name = 'New User', role = 'student') => {
    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, role }),
      });
      // After registering, log them in automatically
      return await signIn(email, password);
    } catch (err: any) {
      return { error: { message: err.message } };
    }
  };

  const signOut = () => {
    removeToken();
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
