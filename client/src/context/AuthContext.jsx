// src/context/AuthContext.jsx
// Global authentication state using React Context + useState
// Demonstrates: createContext, useContext, useState, Provider pattern (Lecture 48)

import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login as loginApi, signup as signupApi, logout as logoutApi } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: verify if a valid session cookie exists
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await getMe();
        setUser(res.data.user || res.data.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email, password) => {
    const res = await loginApi({ email, password });
    const userData = res.data.user || res.data.data;
    setUser(userData);
    return userData;
  };

  const signup = async (name, email, password, confirmPassword) => {
    const res = await signupApi({ name, email, password, confirmPassword: confirmPassword || password });
    const userData = res.data.user || res.data.data;
    setUser(userData);
    return userData;
  };


  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Clear state regardless of server response
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
