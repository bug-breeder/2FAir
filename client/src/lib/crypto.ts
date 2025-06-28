/**
 * Client-side encryption/decryption for 2FAir zero-knowledge architecture
 * Uses AES-GCM with WebAuthn-derived keys to encrypt TOTP secrets
 */

export interface EncryptedData {
  ciphertext: string; // Base64 encoded
  iv: string; // Base64 encoded
  authTag: string; // Base64 encoded
}

/**
 * Encrypts plaintext data using AES-GCM
 */
export async function encryptData(
  plaintext: string,
  key: Uint8Array,
): Promise<EncryptedData> {
  try {
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

    // Import encryption key
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "AES-GCM" },
      false,
      ["encrypt"],
    );

    // Encrypt the data
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      cryptoKey,
      new TextEncoder().encode(plaintext),
    );

    // Split encrypted data into ciphertext and auth tag
    const encryptedArray = new Uint8Array(encrypted);
    const ciphertext = encryptedArray.slice(0, -16); // Everything except last 16 bytes
    const authTag = encryptedArray.slice(-16); // Last 16 bytes are the auth tag

    return {
      ciphertext: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(iv),
      authTag: arrayBufferToBase64(authTag),
    };
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error(
      `Encryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Decrypts encrypted data using AES-GCM
 */
export async function decryptData(
  encryptedData: EncryptedData,
  key: Uint8Array,
): Promise<string> {
  try {
    // Convert base64 strings back to Uint8Arrays
    const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);
    const iv = base64ToArrayBuffer(encryptedData.iv);
    const authTag = base64ToArrayBuffer(encryptedData.authTag);

    // Combine ciphertext and auth tag
    const ciphertextBytes = new Uint8Array(ciphertext);
    const authTagBytes = new Uint8Array(authTag);
    const combined = new Uint8Array(
      ciphertextBytes.length + authTagBytes.length,
    );

    combined.set(ciphertextBytes);
    combined.set(authTagBytes, ciphertextBytes.length);

    // Import decryption key
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "AES-GCM" },
      false,
      ["decrypt"],
    );

    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(iv),
      },
      cryptoKey,
      combined,
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error(
      `Decryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Generates a cryptographically secure random encryption key
 */
export function generateEncryptionKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32)); // 256-bit key
}

/**
 * Derives an encryption key from a password using PBKDF2
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations: number = 100000,
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );

  const keyBytes = await crypto.subtle.exportKey("raw", key);

  return new Uint8Array(keyBytes);
}

/**
 * Converts ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

/**
 * Converts Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

/**
 * Securely compares two arrays in constant time
 */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;

  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }

  return result === 0;
}

/**
 * Generates a cryptographically secure random salt
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Hashes data using SHA-256
 */
export async function sha256(data: string): Promise<string> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(data),
  );

  return arrayBufferToBase64(hash);
}
