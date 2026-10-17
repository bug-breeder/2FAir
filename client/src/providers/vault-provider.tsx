import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { isSameAccount } from "../lib/vault/backup";
import {
  AutoLock,
  getAutoLock,
  setAutoLock as saveAutoLock,
} from "../lib/vault/preferences";
import {
  deleteVaultRecord,
  loadVaultRecord,
  requestPersistentStorage,
  saveVaultRecord,
} from "../lib/vault/store";
import { Entry, EntryInput, VaultRecord } from "../lib/vault/types";
import * as vault from "../lib/vault/vault";

export type VaultStatus = "loading" | "empty" | "locked" | "unlocked";

export interface PasskeyInfo {
  id: string;
  name: string;
  createdAt: string;
}

interface VaultContextValue {
  status: VaultStatus;
  entries: Entry[];
  hasPasscode: boolean;
  passkeys: PasskeyInfo[];
  autoLock: AutoLock;
  setAutoLock: (value: AutoLock) => void;

  /** Persist a vault created during onboarding without unlocking the app yet. */
  saveSetup: (record: VaultRecord) => Promise<void>;
  finishSetup: (record: VaultRecord, key: CryptoKey) => Promise<void>;

  unlockWithPasscode: (passcode: string) => Promise<void>;
  unlockWithPasskey: () => Promise<void>;
  lock: () => void;

  addEntry: (input: EntryInput) => Promise<Entry>;
  importEntries: (inputs: EntryInput[]) => Promise<number>;
  updateEntry: (id: string, input: EntryInput) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;

  changePasscode: (passcode: string) => Promise<void>;
  removePasscode: () => Promise<void>;
  addPasskey: (name: string) => Promise<void>;
  removePasskey: (id: string) => Promise<void>;
  resetVault: () => Promise<void>;
}

const VaultContext = createContext<VaultContextValue | undefined>(undefined);

const channel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("2fair-vault")
    : null;

function newEntry(input: EntryInput): Entry {
  const now = new Date().toISOString();

  return { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<VaultStatus>("loading");
  const [record, setRecord] = useState<VaultRecord>();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [autoLock, setAutoLockState] = useState<AutoLock>(getAutoLock);

  // The vault key only ever lives in memory.
  const keyRef = useRef<CryptoKey | null>(null);
  const recordRef = useRef<VaultRecord>();
  const entriesRef = useRef<Entry[]>([]);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());

  const applyRecord = useCallback((next: VaultRecord | undefined) => {
    recordRef.current = next;
    setRecord(next);
  }, []);

  const applyEntries = useCallback((next: Entry[]) => {
    entriesRef.current = next;
    setEntries(next);
  }, []);

  const persist = useCallback(
    async (next: VaultRecord) => {
      await saveVaultRecord(next);
      applyRecord(next);
      channel?.postMessage("changed");
    },
    [applyRecord],
  );

  /** Serialize writes so concurrent edits can't overwrite each other. */
  const enqueue = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const run = queueRef.current.then(task, task);

    queueRef.current = run.catch(() => undefined);

    return run;
  }, []);

  const lock = useCallback(() => {
    keyRef.current = null;
    applyEntries([]);
    setStatus(recordRef.current ? "locked" : "empty");
  }, [applyEntries]);

  const openWithKey = useCallback(
    async (key: CryptoKey) => {
      const current = recordRef.current;

      if (!current) throw new Error("No vault");
      applyEntries(await vault.readEntries(current, key));
      keyRef.current = key;
      setStatus("unlocked");
    },
    [applyEntries],
  );

  // Initial load.
  useEffect(() => {
    loadVaultRecord()
      .then((loaded) => {
        applyRecord(loaded);
        setStatus(loaded ? "locked" : "empty");
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error("Failed to open vault storage:", error);
        setStatus("empty");
      });
  }, [applyRecord]);

  // Another tab changed the vault: reload it so we never write stale data.
  useEffect(() => {
    if (!channel) return;

    const onMessage = async () => {
      const loaded = await loadVaultRecord();

      applyRecord(loaded);
      if (!loaded) {
        lock();

        return;
      }
      if (keyRef.current) {
        try {
          applyEntries(await vault.readEntries(loaded, keyRef.current));
        } catch {
          lock();
        }
      } else {
        setStatus("locked");
      }
    };

    channel.addEventListener("message", onMessage);

    return () => channel.removeEventListener("message", onMessage);
  }, [applyEntries, applyRecord, lock]);

  // Auto-lock after inactivity, including while the app is in the background.
  useEffect(() => {
    if (status !== "unlocked" || autoLock === "never") return;

    const timeoutMs = Number(autoLock) * 60_000;
    let lastActive = Date.now();

    const touch = () => {
      lastActive = Date.now();
    };
    const check = () => {
      if (Date.now() - lastActive >= timeoutMs) lock();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") check();
    };

    const events = ["pointerdown", "keydown", "scroll"] as const;

    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    document.addEventListener("visibilitychange", onVisibility);
    const interval = window.setInterval(check, 10_000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
    };
  }, [status, autoLock, lock]);

  const requireUnlocked = useCallback(() => {
    const key = keyRef.current;
    const current = recordRef.current;

    if (!key || !current) throw new Error("Vault is locked");

    return { key, current };
  }, []);

  const writeEntries = useCallback(
    (update: (entries: Entry[]) => Entry[]) =>
      enqueue(async () => {
        const { key, current } = requireUnlocked();
        const next = update(entriesRef.current);

        await persist(await vault.writeEntries(current, key, next));
        applyEntries(next);
      }),
    [applyEntries, enqueue, persist, requireUnlocked],
  );

  const value = useMemo<VaultContextValue>(
    () => ({
      status,
      entries,
      hasPasscode: !!record?.passcode,
      passkeys: (record?.passkeys ?? []).map(({ id, name, createdAt }) => ({
        id,
        name,
        createdAt,
      })),
      autoLock,
      setAutoLock: (next) => {
        saveAutoLock(next);
        setAutoLockState(next);
      },

      saveSetup: (next) => enqueue(() => persist(next)),
      finishSetup: (next, key) =>
        enqueue(async () => {
          await persist(next);
          await openWithKey(key);
          void requestPersistentStorage();
        }),

      unlockWithPasscode: async (passcode) => {
        const current = recordRef.current;

        if (!current) throw new Error("No vault");
        await openWithKey(await vault.unlockWithPasscode(current, passcode));
      },
      unlockWithPasskey: async () => {
        const current = recordRef.current;

        if (!current) throw new Error("No vault");
        await openWithKey(await vault.unlockWithPasskey(current));
      },
      lock,

      addEntry: async (input) => {
        const entry = newEntry(input);

        await writeEntries((list) => [...list, entry]);

        return entry;
      },
      importEntries: async (inputs) => {
        let added = 0;

        await writeEntries((list) => {
          const next = [...list];

          for (const input of inputs) {
            if (next.some((e) => isSameAccount(e, input))) continue;
            next.push(newEntry(input));
            added++;
          }

          return next;
        });

        return added;
      },
      updateEntry: (id, input) =>
        writeEntries((list) =>
          list.map((e) =>
            e.id === id
              ? { ...e, ...input, updatedAt: new Date().toISOString() }
              : e,
          ),
        ),
      deleteEntry: (id) =>
        writeEntries((list) => list.filter((e) => e.id !== id)),

      changePasscode: (passcode) =>
        enqueue(async () => {
          const { key, current } = requireUnlocked();

          await persist(await vault.setPasscode(current, key, passcode));
        }),
      removePasscode: () =>
        enqueue(async () => {
          const { current } = requireUnlocked();

          if (current.passkeys.length === 0) {
            throw new Error("Keep at least one way to unlock");
          }
          await persist(vault.removePasscode(current));
        }),
      addPasskey: (name) =>
        enqueue(async () => {
          const { key, current } = requireUnlocked();

          await persist(await vault.addPasskey(current, key, name));
        }),
      removePasskey: (id) =>
        enqueue(async () => {
          const { current } = requireUnlocked();
          const next = vault.removePasskey(current, id);

          if (!next.passcode && next.passkeys.length === 0) {
            throw new Error("Keep at least one way to unlock");
          }
          await persist(next);
        }),
      resetVault: () =>
        enqueue(async () => {
          await deleteVaultRecord();
          keyRef.current = null;
          applyRecord(undefined);
          applyEntries([]);
          setStatus("empty");
          channel?.postMessage("changed");
        }),
    }),
    [
      status,
      entries,
      record,
      autoLock,
      enqueue,
      persist,
      openWithKey,
      lock,
      writeEntries,
      requireUnlocked,
      applyRecord,
      applyEntries,
    ],
  );

  return (
    <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);

  if (!context) throw new Error("useVault must be used within a VaultProvider");

  return context;
}
