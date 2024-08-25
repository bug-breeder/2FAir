import apiClient from "@/libs/api/axios";

export const addOtp = async (otp: any) => {
  const response = await apiClient.post("/otps", otp);

  return response.data;
};

export const inactivateOtp = async (otpID: string) => {
  const response = await apiClient.put(`/otps/${otpID}/inactivate`);

  return response.data;
};

export const editOtp = async (otpID: string, otp: any) => {
  const response = await apiClient.put(`/otps/${otpID}`, otp);

  return response.data;
};

export const listOtps = async () => {
  const response = await apiClient.get("/otps");

  return response.data;
};

export const generateOtpCodes = async () => {
  const response = await apiClient.get("/otps/codes");

  return response.data;
};

export const deleteOtp = async (otpID: string) => {
  const response = await apiClient.delete(`/otps/${otpID}`);

  return response.data;
};
