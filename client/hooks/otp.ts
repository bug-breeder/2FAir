import { useQuery, useMutation, useQueryClient } from "react-query";

import {
  addOtp,
  inactivateOtp,
  editOtp,
  listOtps,
  generateOtpCodes,
  deleteOtp,
} from "@/libs/api/otp";

export const useAddOtp = () => {
  const queryClient = useQueryClient();

  return useMutation(addOtp, {
    onSuccess: () => {
      queryClient.invalidateQueries("otps");
    },
  });
};

export const useInactivateOtp = () => {
  const queryClient = useQueryClient();

  return useMutation(inactivateOtp, {
    onSuccess: () => {
      queryClient.invalidateQueries("otps");
    },
  });
};

export const useEditOtp = (otpID: string) => {
  const queryClient = useQueryClient();

  return useMutation((otp: any) => editOtp(otpID, otp), {
    onSuccess: () => {
      queryClient.invalidateQueries("otps");
    },
  });
};

export const useListOtps = () => {
  return useQuery("otps", listOtps, {
    cacheTime: Infinity, // Cache forever
    staleTime: Infinity, // Never refetch unless forced
  });
};

export const useGenerateOtpCodes = () => {
  return useQuery("otpCodes", generateOtpCodes, {
    staleTime: 30000, // Cache for 30 seconds
  });
};

export const useDeleteOtp = (otpID: string) => {
  const queryClient = useQueryClient();

  return useMutation(() => deleteOtp(otpID), {
    onSuccess: () => {
      queryClient.invalidateQueries("otps");
    },
  });
};
