import { openDB } from "idb";

const DB_NAME = process.env.DB_NAME || "timeDB";
const STORE_NAME = "timeStore";

const initDB = async () => {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME);
    },
  });

  return db;
};

export const setNetworkTime = async (time: Date) => {
  const db = await initDB();

  await db.put(STORE_NAME, time.toISOString(), "networkTime");
};

export const getNetworkTime = async (): Promise<Date | null> => {
  const db = await initDB();
  const timeString = await db.get(STORE_NAME, "networkTime");

  return timeString ? new Date(timeString) : null;
};
