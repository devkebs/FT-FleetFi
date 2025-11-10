import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    const verifyAuth = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        setError(null);
      } catch (err) {
        localStorage.removeItem('auth_token');
        setError('Authentication failed. Please login again.');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const value = {
    user,
    isLoading,
    error,
    setUser,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}