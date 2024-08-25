import apiClient from "@/libs/api/axios";

export const getLoginHistory = async () => {
  const response = await apiClient.get("/login-history");

  return response.data;
};
