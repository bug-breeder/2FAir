import { useQuery, useMutation, useQueryClient } from "react-query";

import {
  startAuthProcess,
  authCallback,
  refreshAccessToken,
  logout,
  deleteAccount,
} from "@/libs/api/auth";

export const useStartAuthProcess = (provider: string) => {
  return useQuery(["startAuth", provider], () => startAuthProcess(provider));
};

export const useAuthCallback = (provider: string) => {
  return useQuery(["authCallback", provider], () => authCallback(provider));
};

export const useRefreshAccessToken = () => {
  return useMutation(refreshAccessToken);
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation(logout, {
    onSuccess: () => {
      queryClient.invalidateQueries("user");
    },
  });
};

export const useDeleteAccount = () => {
  return useMutation(deleteAccount);
};
