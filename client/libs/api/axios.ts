import axios from "axios";
import { useRefreshAccessToken } from "@/hooks/auth";
import { useEffect } from "react";
import { useMutation, useQueryClient } from "react-query";
import { useRouter } from "next/navigation";
import { refreshAccessToken } from "./auth";

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
  withCredentials: true,
});

// Add a response interceptor
export const useSetupAxiosInterceptors = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const refreshAccessTokenMutation = useMutation(refreshAccessToken, {
    onSuccess: () => {
      queryClient.invalidateQueries(); // Invalidate all queries
    },
    onError: () => {
      router.push("/auth/login");
    },
  });

  useEffect(() => {
    const interceptor = axiosClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If the error is a 401 and we haven't already tried to refresh the token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await refreshAccessTokenMutation.mutateAsync();
            return axiosClient(originalRequest); // Retry the original request
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    // Clean up the interceptor when the component unmounts
    return () => {
      axiosClient.interceptors.response.eject(interceptor);
    };
  }, [refreshAccessTokenMutation]);
};

export default axiosClient;
