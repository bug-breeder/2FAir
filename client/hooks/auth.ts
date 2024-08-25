import { useMutation, useQueryClient } from "react-query";
import {
  startAuthProcess,
  authCallback,
  refreshAccessToken,
  logout,
  deleteAccount,
} from "@/libs/api/auth";

// Start Authentication Process Hook
export const useStartAuthProcess = () => {
  return useMutation((provider: string) => startAuthProcess(provider));
};

// Authentication Callback Hook
export const useAuthCallback = () => {
  return useMutation((provider: string) => authCallback(provider));
};

// Refresh Access Token Hook
export const useRefreshAccessToken = () => {
  return useMutation(refreshAccessToken);
};

// Logout Hook
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation(logout, {
    onSuccess: () => {
      queryClient.invalidateQueries("user");
    },
  });
};

// Delete Account Hook
export const useDeleteAccount = () => {
  return useMutation(deleteAccount);
};
