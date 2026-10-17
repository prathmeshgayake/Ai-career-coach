import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import type { User, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    targetRole?: string;
    githubUsername?: string;
    bio?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  switchStudentContext: (studentId: string) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    return !(savedUser && savedToken);
  });

  // Verify and refresh session in background without logging user out on cold starts
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const res = await apiClient.getMe();
        if (isMounted && res.data) {
          setUser(res.data);
          setToken(storedToken);
          localStorage.setItem('user', JSON.stringify(res.data));
          localStorage.setItem('activeStudentId', res.data.id);
        }
      } catch (err: any) {
        // ONLY clear credentials if server explicitly rejected the token with 401
        // Never clear credentials on network glitches, timeouts, or cold starts!
        if (err?.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('activeStudentId');
          if (isMounted) {
            setUser(null);
            setToken(null);
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await apiClient.login({ email, password });
      const authData = res.data;
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      localStorage.setItem('savedEmail', email.trim());
      localStorage.setItem('activeStudentId', authData.user.id);
      setToken(authData.token);
      setUser(authData.user);
      return authData.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (data: {
    name: string;
    email: string;
    password: string;
    targetRole?: string;
    githubUsername?: string;
    bio?: string;
  }): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await apiClient.signup(data);
      const authData = res.data;
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      localStorage.setItem('savedEmail', data.email.trim());
      localStorage.setItem('activeStudentId', authData.user.id);
      setToken(authData.token);
      setUser(authData.user);
      return authData.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiClient.logout();
    } catch {
      // Continue client cleanup even if network fails
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeStudentId');
    setUser(null);
    setToken(null);
  }, []);

  const switchStudentContext = useCallback(async (studentId: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await apiClient.switchStudent(studentId);
      const data = res.data;
      const targetUser = 'user' in data ? (data as any).user : data;
      const targetToken = 'token' in data ? (data as any).token : null;

      if (targetToken) {
        localStorage.setItem('token', targetToken);
        setToken(targetToken);
      }
      localStorage.setItem('user', JSON.stringify(targetUser));
      localStorage.setItem('activeStudentId', targetUser.id);
      setUser(targetUser);
      return targetUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        signup,
        logout,
        switchStudentContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
