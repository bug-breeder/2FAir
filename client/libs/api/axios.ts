import axios from "axios";

const axiosClient = axios.create({
  baseURL: process.env.SERVER_DOMAIN,
  withCredentials: true,
});

export default axiosClient;
