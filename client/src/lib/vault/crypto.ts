/**
 * Vault cryptography.
 *
 * A random 256-bit vault key encrypts all entries (AES-256-GCM). The vault key
 * itself is wrapped once per unlock method: a passcode-derived key (PBKDF2) or
 * a passkey PRF-derived key (HKDF). Adding or removing an unlock method only
 * re-wraps the vault key; entries never need re-encryption.
 */

export interface EncryptedBlob {
  iv: string; // base64
  ct: string; // base64, ciphertext with GCM tag appended
}

export const PASSCODE_ITERATIONS = 600_000;

export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

export function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";

  for (let i = 0; i < view.length; i++) binary += String.fromCharCode(view[i]);

  return btoa(binary);
}

export function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  return bytes;
}

export function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  return toBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");

  return fromBase64(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
}

export async function generateVaultKey(): Promise<CryptoKey> {
  // Extractable so it can be re-wrapped when unlock methods change.
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

async function encryptBytes(
  key: CryptoKey,
  plaintext: Uint8Array,
): Promise<EncryptedBlob> {
  const iv = randomBytes(12);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext,
  );

  return { iv: toBase64(iv), ct: toBase64(ct) };
}

async function decryptBytes(
  key: CryptoKey,
  blob: EncryptedBlob,
): Promise<Uint8Array> {
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(blob.iv) },
    key,
    fromBase64(blob.ct),
  );

  return new Uint8Array(pt);
}

export async function encryptJSON(
  key: CryptoKey,
  value: unknown,
): Promise<EncryptedBlob> {
  return encryptBytes(key, new TextEncoder().encode(JSON.stringify(value)));
}

export async function decryptJSON<T>(
  key: CryptoKey,
  blob: EncryptedBlob,
): Promise<T> {
  return JSON.parse(new TextDecoder().decode(await decryptBytes(key, blob)));
}

export async function wrapVaultKey(
  vaultKey: CryptoKey,
  wrappingKey: CryptoKey,
): Promise<EncryptedBlob> {
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", vaultKey));

  return encryptBytes(wrappingKey, raw);
}

/** Throws if the wrapping key is wrong (GCM authentication fails). */
export async function unwrapVaultKey(
  blob: EncryptedBlob,
  wrappingKey: CryptoKey,
): Promise<CryptoKey> {
  const raw = await decryptBytes(wrappingKey, blob);

  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, true, [
    "encrypt",
    "decrypt",
  ]);
}

export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations: number = PASSCODE_ITERATIONS,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function deriveKeyFromPrf(
  prfOutput: Uint8Array,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    prfOutput,
    "HKDF",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(32),
      info: new TextEncoder().encode("2fair/vault-key-wrap/v1"),
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
