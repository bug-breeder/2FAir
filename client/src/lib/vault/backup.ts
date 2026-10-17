import {
  decryptJSON,
  deriveKeyFromPassword,
  EncryptedBlob,
  encryptJSON,
  fromBase64,
  PASSCODE_ITERATIONS,
  randomBytes,
  toBase64,
} from "./crypto";
import { Entry, EntryInput, VaultData } from "./types";

interface BackupFile {
  app: "2FAir";
  kind: "backup";
  version: 1;
  createdAt: string;
  kdf: { name: "PBKDF2-SHA256"; salt: string; iterations: number };
  data: EncryptedBlob;
}

export class BackupError extends Error {
  constructor(public code: "invalid-file" | "wrong-password") {
    super(code);
  }
}

export async function createBackup(
  entries: Entry[],
  password: string,
): Promise<string> {
  const salt = randomBytes(16);
  const key = await deriveKeyFromPassword(password, salt, PASSCODE_ITERATIONS);
  const data: VaultData = { entries };
  const file: BackupFile = {
    app: "2FAir",
    kind: "backup",
    version: 1,
    createdAt: new Date().toISOString(),
    kdf: {
      name: "PBKDF2-SHA256",
      salt: toBase64(salt),
      iterations: PASSCODE_ITERATIONS,
    },
    data: await encryptJSON(key, data),
  };

  return JSON.stringify(file, null, 2);
}

function parseBackupFile(text: string): BackupFile | null {
  try {
    const file = JSON.parse(text);

    return file?.app === "2FAir" &&
      file.kind === "backup" &&
      file.kdf &&
      file.data
      ? file
      : null;
  } catch {
    return null;
  }
}

/** Whether `text` looks like a file made by createBackup. */
export function isBackupFile(text: string): boolean {
  return parseBackupFile(text) !== null;
}

export async function readBackup(
  text: string,
  password: string,
): Promise<Entry[]> {
  const file = parseBackupFile(text);

  if (!file) throw new BackupError("invalid-file");

  const key = await deriveKeyFromPassword(
    password,
    fromBase64(file.kdf.salt),
    file.kdf.iterations,
  );

  try {
    return (await decryptJSON<VaultData>(key, file.data)).entries;
  } catch {
    throw new BackupError("wrong-password");
  }
}

export function isSameAccount(a: EntryInput, b: EntryInput): boolean {
  return (
    a.secret === b.secret &&
    a.issuer.toLowerCase() === b.issuer.toLowerCase() &&
    a.label.toLowerCase() === b.label.toLowerCase()
  );
}

export function downloadTextFile(
  filename: string,
  text: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
