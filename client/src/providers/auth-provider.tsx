import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { setAuthManager, apiClient } from "../lib/api/client";

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define which routes require authentication
const PROTECTED_ROUTES = ["/app", "/settings", "/security", "/export"];

const isProtectedRoute = (pathname: string): boolean => {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Start with false for public routes
  const navigate = useNavigate();
  const location = useLocation();

  // Register auth manager with API client for 401 handling
  useEffect(() => {
    setAuthManager({
      onUnauthorized: () => {
        // Clear user state and redirect to login ONLY if on a protected route
        setUser(null);
        if (isProtectedRoute(location.pathname) && !location.pathname.includes("/login")) {
          navigate("/login", { replace: true });
        }
      },
    });
  }, [navigate, location.pathname]);

  // Only check auth on initial load if we're on a protected route
  useEffect(() => {
    if (isProtectedRoute(location.pathname)) {
      checkAuth();
    }
  }, []);

  // Check auth when navigating to protected routes
  useEffect(() => {
    if (isProtectedRoute(location.pathname)) {
      if (!user) {
        checkAuth();
      }
    }
  }, [location.pathname, user]);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      // Use apiClient instead of direct fetch to use correct backend URL
      const userData = await apiClient.get<User>("/api/v1/auth/me");
      setUser(userData);
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuth = async () => {
    try {
      const userData = await apiClient.get<User>("/api/v1/auth/me");
      setUser(userData);
    } catch (error) {
      console.error("Auth refresh failed:", error);
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      // Use apiClient for logout endpoint
      await apiClient.post("/api/v1/auth/logout");
    } catch (error) {
      console.error("Logout API call failed:", error);
      // Continue with local logout even if API call fails
    }

    // Clear local state
    setUser(null);
    navigate("/login");
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refreshAuth,
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
