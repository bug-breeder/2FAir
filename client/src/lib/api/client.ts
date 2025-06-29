import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

import { toast } from "../toast";

const API_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8080";

interface ApiErrorResponse {
  message: string;
  statusCode?: number;
}

// Auth state management for 401 handling
interface AuthManager {
  onUnauthorized: () => void;
}

let authManager: AuthManager | null = null;

export const setAuthManager = (manager: AuthManager) => {
  authManager = manager;
};

class ApiClient {
  private client: AxiosInstance;
  private recentErrors: Set<string> = new Set();

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
      },
      // Use httpOnly cookies for authentication
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - no need to add Authorization header for httpOnly cookies
    this.client.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiErrorResponse>) => {
        // Handle 401 errors by calling auth manager
        if (error.response?.status === 401) {
          if (authManager) {
            authManager.onUnauthorized();
          } else {
            // Fallback: redirect to login if no auth manager
            if (!window.location.pathname.includes("/login")) {
              window.location.href = "/login";
            }
          }
        } else {
          // Show error toast for other errors
          const message = this.getErrorMessage(error);

          // Only show error toast if it's not a duplicate within the last 2 seconds
          const errorKey = `${error.response?.status || "unknown"}-${message}`;

          if (!this.recentErrors.has(errorKey)) {
            this.recentErrors.add(errorKey);
            toast.error(message);

            // Remove from recent errors after 2 seconds
            setTimeout(() => {
              this.recentErrors.delete(errorKey);
            }, 2000);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  private getErrorMessage(error: AxiosError<ApiErrorResponse>): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    const status = error.response?.status;

    if (status === 401) {
      return "Your session has expired. Please log in again.";
    }

    if (status === 403) {
      return "You do not have permission to perform this action";
    }

    if (status && status >= 500) {
      return "Server error. Please try again later.";
    }

    return "An unexpected error occurred";
  }

  public async get<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<T>(url, config);

    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, data, config);

    return response.data;
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.put<T>(url, data, config);

    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<T>(url, config);

    return response.data;
  }
}

export const apiClient = new ApiClient();
