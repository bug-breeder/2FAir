import { apiClient } from "./client";

export const addOtp = async (otp: any) => {
  return await apiClient.post("/api/v1/otp", otp);
};

export const inactivateOtp = async (otpID: string) => {
  return await apiClient.post(`/api/v1/otp/${otpID}/inactivate`);
};

export const editOtp = async (otpID: string, otp: any) => {
  return await apiClient.put(`/api/v1/otp/${otpID}`, otp);
};

export const listOtps = async () => {
  return await apiClient.get("/api/v1/otp");
};

// generateOtpCodes removed - now using client-side generation for zero-knowledge architecture
