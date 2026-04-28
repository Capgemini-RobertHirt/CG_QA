<<<<<<< HEAD
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  roles: string[];
  isAdmin: boolean;
  token: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    const token = localStorage.getItem('auth_token');
    
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      setLoading(true);
      
      // Demo login for testing - no API call needed
      if (username === 'admin' && password === 'admin123') {
        const newUser = {
          id: 'demo-user',
          username: 'admin',
          roles: ['admin', 'config_admin'],
          isAdmin: true,
          token: 'demo-token-123',
        };

        setUser(newUser);
        localStorage.setItem('auth_user', JSON.stringify(newUser));
        localStorage.setItem('auth_token', newUser.token);
        
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${newUser.token}`;
      } else {
        throw new Error('Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
=======
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  id?: string;
  email?: string;
  role?: string;
  name?: string;
  username?: string;
  is_admin?: boolean;
  is_config_admin?: boolean;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isConfigAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setError(null);
          } else if (response.status === 401) {
            localStorage.removeItem('access_token');
            setUser(null);
          }
        } catch (err) {
          console.error('Failed to fetch user:', err);
        }
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      setUser(data.user);
      return data.user;
    } catch (err: any) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('access_token');
      setUser(null);
      setError(null);
    }
  }, []);

  const isAuthenticated = !!user;
  const isAdmin = user?.is_admin === true || user?.role === 'admin';
  const isConfigAdmin = isAdmin || user?.is_config_admin === true;

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isConfigAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
>>>>>>> de4b7e3382df4cc4391d09aa4f1bc027144811a3
