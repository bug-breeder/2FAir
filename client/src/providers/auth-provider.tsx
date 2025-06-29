import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { setAuthManager } from "../lib/api/client";

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Register auth manager with API client for 401 handling
  useEffect(() => {
    setAuthManager({
      onUnauthorized: () => {
        // Clear user state and redirect to login
        setUser(null);
        if (!location.pathname.includes("/login")) {
          navigate("/login", { replace: true });
        }
      },
    });
  }, [navigate, location.pathname]);

  useEffect(() => {
    checkAuth();
  }, []);

  // Refresh auth when navigating to app routes (in case user just logged in)
  useEffect(() => {
    if (location.pathname.startsWith("/app")) {
      refreshAuth();
    }
  }, [location.pathname]);

  const checkAuth = async () => {
    try {
      // Make API call to check auth status (cookies sent automatically)
      const response = await fetch("/api/v1/auth/me", {
        credentials: "include", // Include cookies
      });

      if (response.ok) {
        const userData = await response.json();

        setUser(userData);
      } else {
        // Not authenticated or token expired
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuth = async () => {
    try {
      const response = await fetch("/api/v1/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const userData = await response.json();

        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth refresh failed:", error);
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to clear cookie
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include", // Include cookies
      });
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
