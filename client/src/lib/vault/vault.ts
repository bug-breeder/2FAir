import {
  decryptJSON,
  deriveKeyFromPassword,
  deriveKeyFromPrf,
  encryptJSON,
  fromBase64,
  generateVaultKey,
  PASSCODE_ITERATIONS,
  randomBytes,
  toBase64,
  unwrapVaultKey,
  wrapVaultKey,
} from "./crypto";
import { createPasskey, getPasskeyPrf } from "./passkey";
import { Entry, VaultData, VaultRecord } from "./types";

export class WrongPasscodeError extends Error {
  constructor() {
    super("Wrong passcode");
  }
}

/** A brand-new vault with no unlock methods yet. Not persisted. */
export async function createVault(): Promise<{
  record: VaultRecord;
  key: CryptoKey;
}> {
  const key = await generateVaultKey();
  const data: VaultData = { entries: [] };

  return {
    key,
    record: {
      version: 1,
      createdAt: new Date().toISOString(),
      prfSalt: toBase64(randomBytes(32)),
      passkeys: [],
      data: await encryptJSON(key, data),
    },
  };
}

export async function readEntries(
  record: VaultRecord,
  key: CryptoKey,
): Promise<Entry[]> {
  return (await decryptJSON<VaultData>(key, record.data)).entries;
}

export async function writeEntries(
  record: VaultRecord,
  key: CryptoKey,
  entries: Entry[],
): Promise<VaultRecord> {
  const data: VaultData = { entries };

  return { ...record, data: await encryptJSON(key, data) };
}

export async function setPasscode(
  record: VaultRecord,
  key: CryptoKey,
  passcode: string,
): Promise<VaultRecord> {
  const salt = randomBytes(16);
  const wrappingKey = await deriveKeyFromPassword(
    passcode,
    salt,
    PASSCODE_ITERATIONS,
  );

  return {
    ...record,
    passcode: {
      salt: toBase64(salt),
      iterations: PASSCODE_ITERATIONS,
      wrappedKey: await wrapVaultKey(key, wrappingKey),
    },
  };
}

export function removePasscode(record: VaultRecord): VaultRecord {
  const next = { ...record };

  delete next.passcode;

  return next;
}

export async function addPasskey(
  record: VaultRecord,
  key: CryptoKey,
  name: string,
): Promise<VaultRecord> {
  const { credentialId, prfOutput } = await createPasskey(
    fromBase64(record.prfSalt),
    name,
  );
  const wrappingKey = await deriveKeyFromPrf(prfOutput);

  return {
    ...record,
    passkeys: [
      ...record.passkeys.filter((p) => p.id !== credentialId),
      {
        id: credentialId,
        name,
        createdAt: new Date().toISOString(),
        wrappedKey: await wrapVaultKey(key, wrappingKey),
      },
    ],
  };
}

export function removePasskey(record: VaultRecord, id: string): VaultRecord {
  return { ...record, passkeys: record.passkeys.filter((p) => p.id !== id) };
}

export async function unlockWithPasscode(
  record: VaultRecord,
  passcode: string,
): Promise<CryptoKey> {
  if (!record.passcode) throw new Error("No passcode set");

  const wrappingKey = await deriveKeyFromPassword(
    passcode,
    fromBase64(record.passcode.salt),
    record.passcode.iterations,
  );

  try {
    return await unwrapVaultKey(record.passcode.wrappedKey, wrappingKey);
  } catch {
    throw new WrongPasscodeError();
  }
}

export async function unlockWithPasskey(
  record: VaultRecord,
): Promise<CryptoKey> {
  const { credentialId, prfOutput } = await getPasskeyPrf(
    record.passkeys.map((p) => p.id),
    fromBase64(record.prfSalt),
  );
  const passkey = record.passkeys.find((p) => p.id === credentialId);

  if (!passkey) throw new Error("Unknown passkey");

  return unwrapVaultKey(passkey.wrappedKey, await deriveKeyFromPrf(prfOutput));
}
