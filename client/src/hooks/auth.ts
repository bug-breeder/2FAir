import { useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  display_name: string;
  username: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
  });

  // Check for stored token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");

      if (!token) {
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: false,
        });

        return;
      }

      try {
        // Validate token with server
        const response = await fetch("/api/v1/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const user = await response.json();

          setAuthState({
            isAuthenticated: true,
            user,
            token,
            isLoading: false,
          });
        } else {
          // Token invalid, clear it
          localStorage.removeItem("authToken");
          setAuthState({
            isAuthenticated: false,
            user: null,
            token: null,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("authToken");
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: false,
        });
      }
    };

    checkAuth();
  }, []);

  const login = async (token: string) => {
    localStorage.setItem("authToken", token);

    try {
      // Fetch user info
      const response = await fetch("/api/v1/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const user = await response.json();

        setAuthState({
          isAuthenticated: true,
          user,
          token,
          isLoading: false,
        });
      } else {
        throw new Error("Failed to fetch user info");
      }
    } catch (error) {
      console.error("Login failed:", error);
      localStorage.removeItem("authToken");
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
    });
  };

  // Configure fetch to include auth header
  const authenticatedFetch = (url: string, options: RequestInit = {}) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (authState.token) {
      (headers as Record<string, string>)["Authorization"] =
        `Bearer ${authState.token}`;
    }

    return fetch(url, {
      ...options,
      headers,
    });
  };

  return {
    ...authState,
    login,
    logout,
    authenticatedFetch,
  };
}
