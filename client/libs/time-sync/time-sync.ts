// timeSync.ts
import { NTPClient } from "ntpclient";

import { setNetworkTime, getNetworkTime } from "./db";

export const fetchAndStoreNetworkTime = async () => {
  try {
    const date = await new NTPClient().getNetworkTime();

    await setNetworkTime(date);
  } catch (err) {
    console.log("Failed to fetch network time:", err);
  }
};

export const getStoredNetworkTime = async (): Promise<Date | null> => {
  return await getNetworkTime();
};
