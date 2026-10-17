import { EncryptedBlob } from "./crypto";

export type Algorithm = "SHA1" | "SHA256" | "SHA512";

export interface Entry {
  id: string;
  issuer: string;
  label: string;
  secret: string; // Base32
  algorithm: Algorithm;
  digits: number;
  period: number;
  createdAt: string;
  updatedAt: string;
}

export type EntryInput = Pick<
  Entry,
  "issuer" | "label" | "secret" | "algorithm" | "digits" | "period"
>;

export interface PasskeyRecord {
  id: string; // base64url credential ID
  name: string;
  createdAt: string;
  wrappedKey: EncryptedBlob;
}

export interface PasscodeRecord {
  salt: string;
  iterations: number;
  wrappedKey: EncryptedBlob;
}

/** What's persisted in IndexedDB. Everything sensitive lives inside `data`. */
export interface VaultRecord {
  version: 1;
  createdAt: string;
  prfSalt: string;
  passcode?: PasscodeRecord;
  passkeys: PasskeyRecord[];
  data: EncryptedBlob;
}

export interface VaultData {
  entries: Entry[];
}
