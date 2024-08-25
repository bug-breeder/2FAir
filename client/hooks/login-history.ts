import { useQuery } from "react-query";

import { getLoginHistory } from "@/libs/api/login-history";

export const useGetLoginHistory = () => {
  return useQuery("loginHistory", getLoginHistory);
};
