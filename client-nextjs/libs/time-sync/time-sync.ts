// timeSync.ts
import { Client } from "ntp-time";

import { getServerDate } from "@/libs/time-sync/server-date";

import { setNetworkTime, getNetworkTime } from "./db";

// export const fetchAndStoreNetworkTime = async () => {
//   try {
//     const date = await new NTPClient().getNetworkTime();

//     await setNetworkTime(date);
//   } catch (err) {
//     console.log("Failed to fetch network time:", err);
//   }
// };

export const getStoredNetworkTime = async (): Promise<Date | null> => {
  return await getNetworkTime();
};

export const fetchServerTimeOffset = async () => {
  try {
    const { date, offset, uncertainty } = await getServerDate();
    return offset;
  } catch (err) {
    console.log("Failed to fetch network time:", err);
  }
};
