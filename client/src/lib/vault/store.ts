import { openDB } from "idb";

import { VaultRecord } from "./types";

const DB_NAME = "2fair";
const STORE = "vault";
const KEY = "vault";

const dbPromise = () =>
  openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE);
    },
  });

export async function loadVaultRecord(): Promise<VaultRecord | undefined> {
  return (await dbPromise()).get(STORE, KEY);
}

export async function saveVaultRecord(record: VaultRecord): Promise<void> {
  await (await dbPromise()).put(STORE, record, KEY);
}

export async function deleteVaultRecord(): Promise<void> {
  await (await dbPromise()).delete(STORE, KEY);
}

/** Ask the browser not to evict our data under storage pressure. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
