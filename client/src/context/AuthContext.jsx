import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, check if there is an active session
  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const data = await authService.getMe();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await authService.logout();
    } catch {
      // Even if the request fails, clear the local state
    }
    setUser(null);
  }

  const value = {
    user,
    setUser,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Convenience hook so components don't import useContext + AuthContext separately
export function useAuth() {
  return useContext(AuthContext);
}
