import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

import { toast } from "../toast";

const API_URL = import.meta.env.VITE_SERVER_URL;

interface ApiErrorResponse {
  message: string;
  statusCode?: number;
}

class ApiClient {
  private client: AxiosInstance;
  private recentErrors: Set<string> = new Set();

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, // Important for cookies/auth
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // You can add auth token here if needed
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
        // Don't show toast for 401 errors - let the protected route handle redirect
        if (error.response?.status !== 401) {
          const message = this.getErrorMessage(error);

          // Only show error toast if it's not a duplicate within the last 2 seconds
          const errorKey = `${error.response?.status}-${message}`;

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

    if (error.response?.status === 401) {
      return "Please log in to continue";
    }

    if (error.response?.status === 403) {
      return "You do not have permission to perform this action";
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
