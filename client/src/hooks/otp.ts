import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { addOtp, inactivateOtp, editOtp, listOtps } from "../lib/api/otp";
import { generateAllClientTOTPCodes } from "../lib/totp-client";
import { useAuth } from "../providers/auth-provider";
import { OTP } from "../types/otp";

// Types for better type safety
interface OTPInput {
  active: boolean;
  algorithm: string;
  counter: number;
  createdAt: string;
  digits: number;
  issuer: string;
  label: string;
  method: string;
  period: number;
  secret: string;
}

interface EditOTPParams {
  otpID: string;
  otp: Partial<OTP>;
}

export const useAddOtp = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, OTPInput>({
    mutationFn: addOtp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["otps"] });
      queryClient.invalidateQueries({ queryKey: ["otpCodes"] });
    },
  });
};

export const useInactivateOtp = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, string>({
    mutationFn: inactivateOtp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["otps"] });
      queryClient.invalidateQueries({ queryKey: ["otpCodes"] });
    },
  });
};

export const useEditOtp = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, EditOTPParams>({
    mutationFn: ({ otpID, otp }: EditOTPParams) => editOtp(otpID, otp),
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
  const { data: otps } = useListOtps();

  return useQuery({
    queryKey: ["otpCodes", otps],
    queryFn: async () => {
      if (!otps || !Array.isArray(otps) || otps.length === 0) {
        return [];
      }

      return await generateAllClientTOTPCodes(otps);
    },
    enabled:
      isAuthenticated && !!otps && Array.isArray(otps) && otps.length > 0,
    refetchInterval: 5000, // Refresh every 5 seconds for accurate countdown
    staleTime: 0, // Always consider data stale so it refetches when needed
    gcTime: 60000, // Keep in cache for 1 minute
  });
};
