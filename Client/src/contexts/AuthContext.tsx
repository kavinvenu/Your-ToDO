import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User, OAUTH_URLS, handleOAuthCallback } from '../services/api';
import { socketService } from '../services/socket';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'github') => void;
  loginWithToken: (token: string) => Promise<void>;
  updateUser: (userData: User) => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored token and validate it
    const token = localStorage.getItem('token');
    if (token) {
      validateToken();
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Handle OAuth callback
    const oauthData = handleOAuthCallback();
    if (oauthData) {
      handleOAuthSuccess(oauthData.token, oauthData.user);
    }
  }, []);

  const validateToken = async () => {
    try {
      const user = await api.getCurrentUser();
      setUser(user);
      // Connect to socket after successful authentication
      socketService.connect();
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Disconnect socket if authentication fails
      socketService.disconnect();
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSuccess = (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    setIsLoading(false);
    // Connect to socket after successful OAuth
    socketService.connect();
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { user, token } = await api.login(email, password);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      // Connect to socket after successful login
      socketService.connect();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { user, token } = await api.register(name, email, password);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      // Connect to socket after successful signup
      socketService.connect();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Disconnect socket on logout
      socketService.disconnect();
      setIsLoading(false);
    }
  };

  const loginWithOAuth = (provider: 'google' | 'github') => {
    const url = OAUTH_URLS[provider];
    window.location.href = url;
  };

  const loginWithToken = async (token: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Store the token
      localStorage.setItem('token', token);
      
      // Validate the token by fetching user data
      const user = await api.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      // Connect to socket after successful authentication
      socketService.connect();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Token validation failed');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      socketService.disconnect();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      signup, 
      logout, 
      loginWithOAuth,
      loginWithToken,
      updateUser,
      isLoading, 
      error,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
};