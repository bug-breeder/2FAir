/**
 * WebAuthn integration for 2FAir zero-knowledge architecture
 * Handles WebAuthn registration, authentication, and key derivation
 */

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

/**
 * Starts WebAuthn registration process
 */
export async function beginWebAuthnRegistration(): Promise<WebAuthnRegistrationOptions> {
  const response = await fetch('/api/v1/webauthn/register/begin', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`WebAuthn registration failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Completes WebAuthn registration
 */
export async function finishWebAuthnRegistration(credential: PublicKeyCredential): Promise<void> {
  const response = await fetch('/api/v1/webauthn/register/finish', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: credential.id,
      rawId: Array.from(new Uint8Array(credential.rawId)),
      response: {
        attestationObject: Array.from(new Uint8Array((credential.response as AuthenticatorAttestationResponse).attestationObject)),
        clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
      },
      type: credential.type,
    }),
  });

  if (!response.ok) {
    throw new Error(`WebAuthn registration completion failed: ${response.statusText}`);
  }
}

/**
 * Starts WebAuthn authentication process
 */
export async function beginWebAuthnAuthentication(): Promise<WebAuthnAuthenticationOptions> {
  const response = await fetch('/api/v1/webauthn/authenticate/begin', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
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
export async function finishWebAuthnAuthentication(credential: PublicKeyCredential): Promise<Uint8Array> {
  const response = await fetch('/api/v1/webauthn/authenticate/finish', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: credential.id,
      rawId: Array.from(new Uint8Array(credential.rawId)),
      response: {
        authenticatorData: Array.from(new Uint8Array((credential.response as AuthenticatorAssertionResponse).authenticatorData)),
        clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
        signature: Array.from(new Uint8Array((credential.response as AuthenticatorAssertionResponse).signature)),
        userHandle: (credential.response as AuthenticatorAssertionResponse).userHandle ? 
          Array.from(new Uint8Array((credential.response as AuthenticatorAssertionResponse).userHandle!)) : null,
      },
      type: credential.type,
    }),
  });

  if (!response.ok) {
    throw new Error(`WebAuthn authentication completion failed: ${response.statusText}`);
  }

  // For zero-knowledge architecture, we derive encryption key from WebAuthn credential
  // This is a simplified approach - in production, you'd use PRF extension or similar
  const credentialId = new Uint8Array(credential.rawId);
  const key = await deriveEncryptionKey(credentialId);
  
  return key;
}

/**
 * Gets list of registered WebAuthn credentials
 */
export async function getWebAuthnCredentials(): Promise<WebAuthnCredential[]> {
  const response = await fetch('/api/v1/webauthn/credentials', {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get WebAuthn credentials: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Deletes a WebAuthn credential
 */
export async function deleteWebAuthnCredential(credentialId: string): Promise<void> {
  const response = await fetch(`/api/v1/webauthn/credentials/${credentialId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete WebAuthn credential: ${response.statusText}`);
  }
}

/**
 * Derives encryption key from WebAuthn credential
 * This is a simplified implementation - production should use PRF extension
 */
async function deriveEncryptionKey(credentialId: Uint8Array): Promise<Uint8Array> {
  // Import credential ID as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    credentialId,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive AES-GCM key for encryption
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('2fair-webauthn-salt'), // Static salt for simplicity
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // Export key as raw bytes
  const keyBytes = await crypto.subtle.exportKey('raw', key);
  return new Uint8Array(keyBytes);
}

/**
 * Checks if WebAuthn is supported by the browser
 */
export function isWebAuthnSupported(): boolean {
  return 'credentials' in navigator && 'create' in navigator.credentials;
}

/**
 * Registers a new WebAuthn credential
 */
export async function registerWebAuthnCredential(): Promise<Uint8Array> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported by this browser');
  }

  try {
    // Begin registration
    const options = await beginWebAuthnRegistration();
    
    // Convert challenge and user ID to Uint8Array
    const publicKey = {
      ...options.publicKey,
      challenge: new Uint8Array(options.publicKey.challenge as unknown as ArrayLike<number>),
      user: {
        ...options.publicKey.user,
        id: new Uint8Array(options.publicKey.user.id as unknown as ArrayLike<number>),
      },
    };

    // Create credential
    const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential;
    
    if (!credential) {
      throw new Error('Failed to create WebAuthn credential');
    }

    // Complete registration
    await finishWebAuthnRegistration(credential);

    // Derive and return encryption key
    const encryptionKey = await deriveEncryptionKey(new Uint8Array(credential.rawId));
    
    return encryptionKey;
  } catch (error) {
    console.error('WebAuthn registration failed:', error);
    throw new Error(`WebAuthn registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Authenticates with WebAuthn and derives encryption key
 */
export async function authenticateWebAuthn(): Promise<Uint8Array> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported by this browser');
  }

  try {
    // Begin authentication
    const options = await beginWebAuthnAuthentication();
    
    // Convert challenge to Uint8Array
    const publicKey = {
      ...options.publicKey,
      challenge: new Uint8Array(options.publicKey.challenge as unknown as ArrayLike<number>),
      allowCredentials: options.publicKey.allowCredentials?.map(cred => ({
        ...cred,
        id: new Uint8Array(cred.id as unknown as ArrayLike<number>),
      })),
    };

    // Get credential
    const credential = await navigator.credentials.get({ publicKey }) as PublicKeyCredential;
    
    if (!credential) {
      throw new Error('Failed to get WebAuthn credential');
    }

    // Complete authentication and get encryption key
    const encryptionKey = await finishWebAuthnAuthentication(credential);
    
    return encryptionKey;
  } catch (error) {
    console.error('WebAuthn authentication failed:', error);
    throw new Error(`WebAuthn authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 