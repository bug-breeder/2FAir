import apiClient from "@/libs/api/axios";

export const startAuthProcess = async (provider: string) => {
  const response = await apiClient.get(`/auth/${provider}`);

  return response.data;
};

export const authCallback = async (provider: string) => {
  const response = await apiClient.get(`/auth/${provider}/callback`);

  return response.data;
};

export const refreshAccessToken = async () => {
  const response = await apiClient.post("/auth/refresh");

  return response.data;
};

export const logout = async () => {
  const response = await apiClient.post("/auth/logout");

  return response.data;
};

export const deleteAccount = async () => {
  const response = await apiClient.delete("/auth/delete");

  return response.data;
};
