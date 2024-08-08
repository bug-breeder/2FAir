import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://2fair-server.fly.dev/",
  withCredentials: true,
});

export default axiosClient;
