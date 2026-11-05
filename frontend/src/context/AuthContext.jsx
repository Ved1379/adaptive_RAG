import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { loginUser, registerUser, getMe } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('adaptive_rag_token'));
  const [isLoading, setIsLoading] = useState(true);
  const authGenerationRef = useRef(0);

  // Validate stored token and fetch user details on load
  useEffect(() => {
    let isMounted = true;
    const generation = authGenerationRef.current;
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('adaptive_rag_token');
      if (storedToken) {
        const result = await getMe(storedToken);
        if (isMounted && generation === authGenerationRef.current) {
          if (result.success && result.data) {
            setUser(result.data);
            setToken(storedToken);
          } else {
            // Invalid or expired token
            localStorage.removeItem('adaptive_rag_token');
            setUser(null);
            setToken(null);
          }
        }
      } else if (isMounted && generation === authGenerationRef.current) {
        setUser(null);
        setToken(null);
      }
      if (isMounted && generation === authGenerationRef.current) {
        setIsLoading(false);
      }
    };

    verifyAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const generation = ++authGenerationRef.current;
    setIsLoading(true);
    const result = await loginUser(email, password);
    if (generation !== authGenerationRef.current) return { success: false, error: 'Login was superseded.' };
    setIsLoading(false);

    if (result.success && result.data?.user) {
      setUser(result.data.user);
      setToken(result.data.access_token);
      return { success: true, user: result.data.user };
    }
    return { success: false, error: result.error || 'Login failed.' };
  };

  const register = async ({ email, password, name, department }) => {
    const generation = ++authGenerationRef.current;
    setIsLoading(true);
    const result = await registerUser({ email, password, name, department });
    if (generation !== authGenerationRef.current) return { success: false, error: 'Registration was superseded.' };
    setIsLoading(false);

    if (result.success && result.data?.user) {
      setUser(result.data.user);
      setToken(result.data.access_token);
      return { success: true, user: result.data.user };
    }
    return { success: false, error: result.error || 'Registration failed.' };
  };

  const logout = () => {
    authGenerationRef.current += 1;
    localStorage.removeItem('adaptive_rag_token');
    setUser(null);
    setToken(null);
  };

  const isAuthenticated = Boolean(user && token);
  const isAdmin = user?.role === 'ADMIN';
  const isStudent = user?.role === 'USER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isAdmin,
        isStudent,
        role: user?.role || 'GUEST',
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
