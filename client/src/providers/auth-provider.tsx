import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiClient } from "../lib/api/client";

interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (provider: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Try to get current user info
      const user = await apiClient.get<User>("/api/v1/auth/me");
      setUser(user);
    } catch (error) {
      // If that fails, try to refresh token
      try {
        await apiClient.post("/api/v1/auth/refresh");
        // If refresh succeeds, try to get user info again
        const user = await apiClient.get<User>("/api/v1/auth/me");
        setUser(user);
      } catch (refreshError) {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (provider: string) => {
    try {
      // Redirect to OAuth provider
      window.location.href = `${import.meta.env.VITE_SERVER_URL}/api/v1/auth/${provider}`;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.delete("/api/v1/auth/refresh");
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if logout fails, clear local state
      setUser(null);
      navigate("/login");
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
