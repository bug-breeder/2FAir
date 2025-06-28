/**
 * WebAuthn integration for 2FAir zero-knowledge architecture
 * Handles WebAuthn registration, authentication, and key derivation
 */

// Session-based key storage to maintain consistency
let sessionEncryptionKey: Uint8Array | null = null;

export interface WebAuthnCredential {
  id: string;
  name: string;
  createdAt: string;
}

export interface WebAuthnRegistrationOptions {
  publicKey: PublicKeyCredentialCreationOptions;
}

export interface WebAuthnAuthenticationOptions {
  publicKey: PublicKeyCredentialRequestOptions;
}

export interface WebAuthnAuthenticationResponse {
  success: boolean;
  message: string;
  credential: {
    id: string;
    credentialId: Uint8Array;
    lastUsedAt?: Date;
    signCount: number;
  };
  prfOutput?: string; // Base64-encoded PRF output from server
}

/**
 * Starts WebAuthn registration process
 */
export async function beginWebAuthnRegistration(): Promise<WebAuthnRegistrationOptions> {
  const response = await fetch("/api/v1/webauthn/register/begin", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      "WebAuthn registration begin failed:",
      response.status,
      errorText,
    );
    throw new Error(
      `WebAuthn registration failed: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  return await response.json();
}

/**
 * Completes WebAuthn registration
 */
export async function finishWebAuthnRegistration(
  credential: PublicKeyCredential,
): Promise<void> {
  const requestData = {
    id: credential.id,
    rawId: uint8ArrayToBase64Url(new Uint8Array(credential.rawId)),
    response: {
      attestationObject: uint8ArrayToBase64Url(
        new Uint8Array(
          (
            credential.response as AuthenticatorAttestationResponse
          ).attestationObject,
        ),
      ),
      clientDataJSON: uint8ArrayToBase64Url(
        new Uint8Array(credential.response.clientDataJSON),
      ),
    },
    type: credential.type,
  };

  const response = await fetch("/api/v1/webauthn/register/finish", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      "WebAuthn registration completion failed:",
      response.status,
      errorText,
    );
    throw new Error(
      `WebAuthn registration completion failed: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }
}

/**
 * Starts WebAuthn authentication process
 */
export async function beginWebAuthnAuthentication(): Promise<WebAuthnAuthenticationOptions> {
  const response = await fetch("/api/v1/webauthn/authenticate/begin", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`WebAuthn authentication failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Completes WebAuthn authentication and derives encryption key
 */
export async function finishWebAuthnAuthentication(
  credential: PublicKeyCredential,
): Promise<Uint8Array> {
  // Get client extension results
  const clientExtensionResults = credential.getClientExtensionResults?.();

  const requestData: any = {
    id: credential.id,
    rawId: uint8ArrayToBase64Url(new Uint8Array(credential.rawId)),
    response: {
      authenticatorData: uint8ArrayToBase64Url(
        new Uint8Array(
          (
            credential.response as AuthenticatorAssertionResponse
          ).authenticatorData,
        ),
      ),
      clientDataJSON: uint8ArrayToBase64Url(
        new Uint8Array(credential.response.clientDataJSON),
      ),
      signature: uint8ArrayToBase64Url(
        new Uint8Array(
          (credential.response as AuthenticatorAssertionResponse).signature,
        ),
      ),
      userHandle: (credential.response as AuthenticatorAssertionResponse)
        .userHandle
        ? uint8ArrayToBase64Url(
            new Uint8Array(
              (
                credential.response as AuthenticatorAssertionResponse
              ).userHandle!,
            ),
          )
        : null,
    },
    type: credential.type,
  };

  // Include client extension results if present
  if (clientExtensionResults) {
    requestData.clientExtensionResults = clientExtensionResults;
    // Also add as getClientExtensionResults for compatibility
    requestData.getClientExtensionResults = clientExtensionResults;
  }

  const response = await fetch("/api/v1/webauthn/authenticate/finish", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    throw new Error(
      `WebAuthn authentication completion failed: ${response.statusText}`,
    );
  }

  const result: WebAuthnAuthenticationResponse = await response.json();

  // Decode PRF output from base64 if present
  let prfOutput: Uint8Array | undefined;

  if (result.prfOutput) {
    const prfBase64 =
      typeof result.prfOutput === "string" ? result.prfOutput : "";

    if (prfBase64) {
      try {
        const prfBinary = atob(prfBase64);

        prfOutput = new Uint8Array(prfBinary.length);
        for (let i = 0; i < prfBinary.length; i++) {
          prfOutput[i] = prfBinary.charCodeAt(i);
        }
      } catch (error) {
        console.warn("Failed to decode PRF output from server:", error);
      }
    }
  }

  // Use PRF-based key derivation with credential.id fallback
  const key = await deriveEncryptionKey(credential, prfOutput);

  return key;
}

/**
 * Gets list of registered WebAuthn credentials
 */
export async function getWebAuthnCredentials(): Promise<WebAuthnCredential[]> {
  const response = await fetch("/api/v1/webauthn/credentials", {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get WebAuthn credentials: ${response.statusText}`,
    );
  }

  return await response.json();
}

/**
 * Deletes a WebAuthn credential
 */
export async function deleteWebAuthnCredential(
  credentialId: string,
): Promise<void> {
  const response = await fetch(`/api/v1/webauthn/credentials/${credentialId}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to delete WebAuthn credential: ${response.statusText}`,
    );
  }
}

/**
 * Derives encryption key from WebAuthn credential with PRF support
 * Uses PRF when available, falls back to credential.id for compatibility
 */
async function deriveEncryptionKey(
  credential: PublicKeyCredential,
  prfOutput?: Uint8Array,
): Promise<Uint8Array> {
  // Try PRF first (more secure)
  const clientExtensionResults = credential.getClientExtensionResults?.();
  const prfResults = clientExtensionResults?.prf?.results;

  // Check for PRF output from client extension results
  if (prfResults?.first) {
    console.log("Using PRF from client extension results for key derivation");
    const prfData = bufferSourceToUint8Array(prfResults.first);

    return await deriveKeyFromPRF(prfData);
  }

  // Check for PRF output from server response
  if (prfOutput) {
    console.log("Using PRF from server response for key derivation");

    return await deriveKeyFromPRF(prfOutput);
  }

  // Fallback to credential.id (current implementation)
  console.log("Using credential.id fallback for key derivation");
  const credentialId = new TextEncoder().encode(credential.id);

  return await deriveKeyFromCredentialId(credentialId);
}

/**
 * Derives encryption key from WebAuthn PRF output
 * Uses HKDF for key derivation from PRF data
 */
async function deriveKeyFromPRF(prfOutput: Uint8Array): Promise<Uint8Array> {
  // PRF output is already cryptographically strong
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    prfOutput,
    { name: "HKDF" },
    false,
    ["deriveKey"],
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new TextEncoder().encode("2fair-prf-salt"),
      info: new TextEncoder().encode("2fair-encryption-key"),
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );

  // Export key as raw bytes
  const keyBytes = await crypto.subtle.exportKey("raw", key);

  return new Uint8Array(keyBytes);
}

/**
 * Derives encryption key from WebAuthn credential ID (fallback method)
 * Uses PBKDF2 with the credential ID as consistent key material
 */
async function deriveKeyFromCredentialId(
  credentialId: Uint8Array,
): Promise<Uint8Array> {
  // Import credential ID as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    credentialId,
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  // Derive AES-GCM key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode("2fair-webauthn-salt"), // Static salt for simplicity
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );

  // Export key as raw bytes
  const keyBytes = await crypto.subtle.exportKey("raw", key);

  return new Uint8Array(keyBytes);
}

/**
 * Checks if WebAuthn is supported by the browser
 */
export function isWebAuthnSupported(): boolean {
  return "credentials" in navigator && "create" in navigator.credentials;
}

/**
 * Converts Uint8Array to base64url string
 */
function uint8ArrayToBase64Url(uint8Array: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...uint8Array));

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Converts BufferSource to Uint8Array
 */
function bufferSourceToUint8Array(bufferSource: BufferSource): Uint8Array {
  if (bufferSource instanceof Uint8Array) {
    return bufferSource;
  }
  if (bufferSource instanceof ArrayBuffer) {
    return new Uint8Array(bufferSource);
  }
  if (ArrayBuffer.isView(bufferSource)) {
    return new Uint8Array(
      bufferSource.buffer,
      bufferSource.byteOffset,
      bufferSource.byteLength,
    );
  }
  throw new Error(`Unsupported BufferSource type`);
}

/**
 * Converts base64url string or BufferSource to Uint8Array
 */
function base64UrlToUint8Array(input: string | BufferSource): Uint8Array {
  // Handle different input types
  if (input instanceof Uint8Array) {
    return input;
  }
  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input);
  }
  if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }
  if (typeof input !== "string") {
    console.error("Invalid base64url input:", input);
    throw new Error(`Expected string or BufferSource, got ${typeof input}`);
  }

  // Convert base64url to base64
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");

  // Add padding if needed
  while (base64.length % 4) {
    base64 += "=";
  }

  // Decode base64 to binary string
  const binaryString = atob(base64);

  // Convert binary string to Uint8Array
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

/**
 * Registers a new WebAuthn credential
 */
export async function registerWebAuthnCredential(): Promise<Uint8Array> {
  if (!isWebAuthnSupported()) {
    throw new Error("WebAuthn is not supported by this browser");
  }

  try {
    // Begin registration
    const options = await beginWebAuthnRegistration();

    // Validate response structure
    if (!options || !options.publicKey) {
      throw new Error(
        "Invalid WebAuthn registration response: missing publicKey",
      );
    }

    if (!options.publicKey.challenge) {
      throw new Error(
        "Invalid WebAuthn registration response: missing challenge",
      );
    }

    if (!options.publicKey.user || !options.publicKey.user.id) {
      throw new Error(
        "Invalid WebAuthn registration response: missing user.id",
      );
    }

    // Convert base64url-encoded fields to Uint8Array
    const publicKey = {
      ...options.publicKey,
      challenge: base64UrlToUint8Array(options.publicKey.challenge),
      user: {
        ...options.publicKey.user,
        id: base64UrlToUint8Array(options.publicKey.user.id),
      },
      // Convert excludeCredentials if present
      excludeCredentials: options.publicKey.excludeCredentials?.map((cred) => ({
        ...cred,
        id: base64UrlToUint8Array(cred.id),
      })),
    };

    // Create credential
    const credential = (await navigator.credentials.create({
      publicKey,
    })) as PublicKeyCredential;

    if (!credential) {
      throw new Error("Failed to create WebAuthn credential");
    }

    // Complete registration
    await finishWebAuthnRegistration(credential);

    // Derive and return encryption key using PRF if available
    const encryptionKey = await deriveEncryptionKey(credential);

    return encryptionKey;
  } catch (error) {
    console.error("WebAuthn registration failed:", error);
    throw new Error(
      `WebAuthn registration failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Authenticates with WebAuthn and derives encryption key
 */
export async function authenticateWebAuthn(): Promise<Uint8Array> {
  if (!isWebAuthnSupported()) {
    throw new Error("WebAuthn is not supported by this browser");
  }

  try {
    // Begin authentication
    const options = await beginWebAuthnAuthentication();

    // Convert base64url-encoded fields to Uint8Array
    const publicKey: PublicKeyCredentialRequestOptions = {
      ...options.publicKey,
      challenge: base64UrlToUint8Array(options.publicKey.challenge),
      allowCredentials: options.publicKey.allowCredentials?.map((cred) => ({
        ...cred,
        id: base64UrlToUint8Array(cred.id),
      })),
    };

    // Handle PRF extension separately with proper type conversion
    if (options.publicKey.extensions?.prf?.eval?.first) {
      if (!publicKey.extensions) publicKey.extensions = {};

      const prfEval: any = {
        first: base64UrlToUint8Array(
          options.publicKey.extensions.prf.eval.first,
        ),
      };

      // Add second PRF value if present
      if (options.publicKey.extensions.prf.eval.second) {
        prfEval.second = base64UrlToUint8Array(
          options.publicKey.extensions.prf.eval.second,
        );
      }

      publicKey.extensions.prf = { eval: prfEval };
    }

    // Get credential
    const credential = (await navigator.credentials.get({
      publicKey,
    })) as PublicKeyCredential;

    if (!credential) {
      throw new Error("Failed to get WebAuthn credential");
    }

    // Complete authentication and get encryption key
    const encryptionKey = await finishWebAuthnAuthentication(credential);

    return encryptionKey;
  } catch (error) {
    console.error("WebAuthn authentication failed:", error);
    throw new Error(
      `WebAuthn authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Gets the current session encryption key, or derives a new one if needed
 */
export async function getSessionEncryptionKey(): Promise<Uint8Array> {
  if (sessionEncryptionKey) {
    return sessionEncryptionKey;
  }

  // Need to authenticate to get the key
  const key = await authenticateWebAuthn();

  sessionEncryptionKey = key;

  return key;
}

/**
 * Clears the session encryption key (useful for logout)
 */
export function clearSessionEncryptionKey(): void {
  sessionEncryptionKey = null;
}
