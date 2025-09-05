import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { UserLoginRequest, UserRegisterRequest, UnifiedUser, AuthResponse } from '../types';
import { authService, handleApiError } from '../services/api';

interface AuthContextType {
  // Unified Authentication
  user: UnifiedUser | null;
  login: (credentials: UserLoginRequest) => Promise<AuthResponse>;
  register: (userData: UserRegisterRequest) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [skipInitialization, setSkipInitialization] = useState(false);

  const isAuthenticated = !!user;
  const isAdminAuthenticated = !!user && user.is_admin;

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      if (skipInitialization) return;
      
      setIsLoading(true);
      
      // Check for auth token (unified for both users and admins)
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Failed to get user data:', error);
          localStorage.removeItem('authToken');
          setUser(null);
        }
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, [skipInitialization]);

  const login = async (credentials: UserLoginRequest) => {
    try {
      const response = await authService.login(credentials);
      localStorage.setItem('authToken', response.access_token);
      setUser(response.user);
      setSkipInitialization(true); // Prevent initialization from overwriting login data
      
      return response;
    } catch (error) {
      const apiError = handleApiError(error);
      throw new Error(apiError.detail);
    }
  };

  const register = async (userData: UserRegisterRequest) => {
    try {
      const response = await authService.register(userData);
      localStorage.setItem('authToken', response.access_token);
      setUser(response.user);
    } catch (error) {
      const apiError = handleApiError(error);
      throw new Error(apiError.detail);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setSkipInitialization(false); // Re-enable initialization for next login
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.roles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isLoading,
        isAuthenticated,
        isAdminAuthenticated,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};