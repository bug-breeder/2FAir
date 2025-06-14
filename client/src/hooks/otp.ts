import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  addOtp,
  inactivateOtp,
  editOtp,
  listOtps,
  generateOtpCodes,
} from "../lib/api/otp";
import { useAuth } from "../providers/auth-provider";

export const useAddOtp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addOtp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["otps"] });
      queryClient.invalidateQueries({ queryKey: ["otpCodes"] });
    },
  });
};

export const useInactivateOtp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inactivateOtp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["otps"] });
      queryClient.invalidateQueries({ queryKey: ["otpCodes"] });
    },
  });
};

export const useEditOtp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ otpID, otp }: { otpID: string; otp: any }) =>
      editOtp(otpID, otp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["otps"] });
      queryClient.invalidateQueries({ queryKey: ["otpCodes"] });
    },
  });
};

export const useListOtps = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["otps"],
    queryFn: listOtps,
    enabled: isAuthenticated, // Only run when authenticated
    gcTime: Infinity, // Cache forever (renamed from cacheTime)
    staleTime: Infinity, // Never refetch unless forced
  });
};

export const useGenerateOtpCodes = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["otpCodes"],
    queryFn: generateOtpCodes,
    enabled: isAuthenticated, // Only run when authenticated
    refetchInterval: 30000, // Refetch every 30 seconds to get fresh next codes
    staleTime: 0, // Always consider data stale so it refetches when needed
    gcTime: 60000, // Keep in cache for 1 minute
  });
};
