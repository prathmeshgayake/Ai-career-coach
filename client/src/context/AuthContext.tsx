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
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session from stored token or user ID
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          const res = await apiClient.getMe();
          if (isMounted && res.data) {
            setUser(res.data);
            setToken(storedToken);
            localStorage.setItem('activeStudentId', res.data.id);
          }
        } else {
          // If no token exists yet, check if there is an activeStudentId
          const activeStudentId = localStorage.getItem('activeStudentId');
          if (activeStudentId) {
            const res = await apiClient.getMe();
            if (isMounted && res.data) {
              setUser(res.data);
            }
          }
        }
      } catch (err) {
        // Token expired or invalid
        localStorage.removeItem('token');
        if (isMounted) {
          setUser(null);
          setToken(null);
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
