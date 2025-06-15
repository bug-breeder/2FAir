# Cryptographic Design - 2FAir E2E Encryption

## Overview

This document details the cryptographic design and implementation for 2FAir's end-to-end encrypted TOTP vault. The system uses WebAuthn PRF (Pseudo-Random Function) for key derivation and AES-GCM for authenticated encryption of TOTP seeds.

## Cryptographic Primitives

### Core Algorithms

| Operation | Algorithm | Key Size | Notes |
|-----------|-----------|----------|--------|
| Key Derivation | HKDF-SHA256 | 256-bit | RFC 5869 |
| Symmetric Encryption | AES-256-GCM | 256-bit | NIST SP 800-38D |
| Key Wrapping | AES-KW | 256-bit | RFC 3394 |
| WebAuthn PRF | HMAC-SHA256 | 256-bit | WebAuthn Level 2 |
| Random Generation | CSPRNG | - | Web Crypto API |

### Security Parameters

| Parameter | Value | Rationale |
|-----------|--------|-----------|
| AES-GCM IV Size | 96 bits | NIST recommended |
| HKDF Salt Size | 256 bits | High entropy for KDF |
| KEK Size | 256 bits | AES-256 key size |
| DEK Size | 256 bits | AES-256 key size |
| Auth Tag Size | 128 bits | AES-GCM default |

## Key Hierarchy and Derivation

### Key Hierarchy Overview

```
WebAuthn Authenticator
         │
         ▼
   PRF Extension ──────► PRF Output (32 bytes)
         │                     │
         │                     ▼
         │              HKDF-Extract ──► PRF-Key (32 bytes)
         │                     │
         │                     ▼
         │              HKDF-Expand ──► KEK (32 bytes)
         │                     │
         │                     ▼
         │               AES-Key-Wrap ──► Wrapped DEK
         │                     │
         │                     ▼
         └─────────────► Stored in Database
                               │
                               ▼
                        AES-Key-Unwrap ──► DEK (32 bytes)
                               │
                               ▼
                         AES-256-GCM ──► Encrypted TOTP Seeds
```

### Key Derivation Process

#### Step 1: WebAuthn PRF Key Generation
```javascript
// During WebAuthn credential creation
const credential = await navigator.credentials.create({
  publicKey: {
    // ... standard WebAuthn options
    extensions: {
      prf: {}  // Enable PRF extension
    }
  }
});

// PRF is now available for this credential
const prfAvailable = credential.getClientExtensionResults().prf;
```

#### Step 2: PRF-based KEK Derivation
```javascript
// During authentication
const assertion = await navigator.credentials.get({
  publicKey: {
    // ... authentication options
    extensions: {
      prf: {
        eval: {
          first: new TextEncoder().encode("2FAir-KEK-v1")
        }
      }
    }
  }
});

const prfOutputs = assertion.getClientExtensionResults().prf.results;
const prfKey = prfOutputs.first; // 32 bytes from PRF

// HKDF to derive KEK
const salt = crypto.getRandomValues(new Uint8Array(32));
const kek = await crypto.subtle.deriveBits({
  name: "HKDF",
  hash: "SHA-256",
  salt: salt,
  info: new TextEncoder().encode("2FAir-KEK-Derivation")
}, prfKey, 256);
```

#### Step 3: DEK Generation and Wrapping
```javascript
// Generate DEK for user's data
const dek = crypto.getRandomValues(new Uint8Array(32));

// Wrap DEK with KEK using AES-KW
const wrappedDEK = await crypto.subtle.wrapKey(
  "raw",
  await crypto.subtle.importKey("raw", dek, "AES-GCM", true, ["encrypt", "decrypt"]),
  await crypto.subtle.importKey("raw", kek, "AES-KW", false, ["wrapKey"]),
  "AES-KW"
);

// Store wrapped DEK in database
await storeUserEncryptionKey({
  userId: user.id,
  wrappedDEK: wrappedDEK,
  salt: salt
});
```

## Encryption Operations

### TOTP Seed Encryption

#### Plaintext Structure
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "algorithm": "SHA1",
  "digits": 6,
  "period": 30,
  "issuer": "Example Service",
  "accountName": "user@example.com",
  "metadata": {
    "addedAt": "2025-01-07T10:00:00Z",
    "deviceId": "device-123"
  }
}
```

#### Encryption Process
```javascript
async function encryptTOTPSeed(plaintext, dek) {
  // Generate random IV (96 bits for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Convert plaintext to bytes
  const plaintextBytes = new TextEncoder().encode(JSON.stringify(plaintext));
  
  // Import DEK
  const key = await crypto.subtle.importKey(
    "raw", 
    dek, 
    "AES-GCM", 
    false, 
    ["encrypt"]
  );
  
  // Encrypt with AES-GCM
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
      tagLength: 128
    },
    key,
    plaintextBytes
  );
  
  // Extract auth tag (last 16 bytes)
  const authTag = ciphertext.slice(-16);
  const ct = ciphertext.slice(0, -16);
  
  return {
    ciphertext: ct,
    iv: iv,
    authTag: authTag
  };
}
```

#### Decryption Process
```javascript
async function decryptTOTPSeed(encryptedData, dek) {
  const { ciphertext, iv, authTag } = encryptedData;
  
  // Reconstruct full ciphertext with auth tag
  const fullCiphertext = new Uint8Array(ciphertext.length + authTag.length);
  fullCiphertext.set(ciphertext);
  fullCiphertext.set(authTag, ciphertext.length);
  
  // Import DEK
  const key = await crypto.subtle.importKey(
    "raw", 
    dek, 
    "AES-GCM", 
    false, 
    ["decrypt"]
  );
  
  // Decrypt with AES-GCM
  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
      tagLength: 128
    },
    key,
    fullCiphertext
  );
  
  // Parse JSON
  const plaintextString = new TextDecoder().decode(plaintext);
  return JSON.parse(plaintextString);
}
```

## WebAuthn PRF Integration

### PRF Capability Detection
```javascript
async function detectPRFSupport() {
  // Check if WebAuthn is available
  if (!window.PublicKeyCredential) {
    return false;
  }
  
  // Check if PRF extension is supported
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) return false;
    
    // Check PRF extension support
    const supports = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(32),
        extensions: { prf: {} }
      }
    }).catch(() => false);
    
    return !!supports;
  } catch {
    return false;
  }
}
```

### Credential Registration with PRF
```javascript
async function registerWebAuthnCredential(userInfo) {
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: {
        name: "2FAir",
        id: "2fair.dev"
      },
      user: {
        id: new TextEncoder().encode(userInfo.id),
        name: userInfo.email,
        displayName: userInfo.displayName
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },  // ES256
        { alg: -257, type: "public-key" } // RS256
      ],
      authenticatorSelection: {
        userVerification: "required",
        residentKey: "preferred"
      },
      extensions: {
        prf: {} // Enable PRF extension
      }
    }
  });
  
  const prfEnabled = credential.getClientExtensionResults().prf;
  if (!prfEnabled) {
    throw new Error("PRF extension not supported by authenticator");
  }
  
  return credential;
}
```

### PRF-based Authentication
```javascript
async function authenticateWithPRF(challenge, credentialId) {
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: challenge,
      allowCredentials: [{
        id: credentialId,
        type: "public-key"
      }],
      userVerification: "required",
      extensions: {
        prf: {
          eval: {
            first: new TextEncoder().encode("2FAir-KEK-v1")
          }
        }
      }
    }
  });
  
  const prfResults = assertion.getClientExtensionResults().prf;
  if (!prfResults || !prfResults.results) {
    throw new Error("PRF evaluation failed");
  }
  
  return {
    assertion: assertion,
    prfOutput: prfResults.results.first
  };
}
```

## Key Rotation and Management

### Key Rotation Process
```javascript
async function rotateUserKeys(userId, newPRFOutput) {
  // Get current key version
  const currentKey = await getCurrentUserEncryptionKey(userId);
  const newVersion = currentKey.version + 1;
  
  // Derive new KEK from new PRF output
  const newSalt = crypto.getRandomValues(new Uint8Array(32));
  const newKEK = await deriveKEKFromPRF(newPRFOutput, newSalt);
  
  // Generate new DEK
  const newDEK = crypto.getRandomValues(new Uint8Array(32));
  
  // Wrap new DEK with new KEK
  const wrappedNewDEK = await wrapDEK(newDEK, newKEK);
  
  // Store new key version
  await storeUserEncryptionKey({
    userId: userId,
    version: newVersion,
    wrappedDEK: wrappedNewDEK,
    salt: newSalt
  });
  
  // Re-encrypt all user data with new DEK
  await reencryptUserData(userId, currentKey.dek, newDEK);
  
  // Deactivate old key version
  await deactivateUserEncryptionKey(userId, currentKey.version);
}
```

### Backup Key Generation
```javascript
async function generateBackupRecoveryCode(userId, userPassphrase) {
  // Get current encryption key
  const currentKey = await getCurrentUserEncryptionKey(userId);
  
  // Derive backup KEK from user passphrase
  const backupSalt = crypto.getRandomValues(new Uint8Array(32));
  const backupKEK = await crypto.subtle.deriveBits({
    name: "PBKDF2",
    hash: "SHA-256",
    salt: backupSalt,
    iterations: 100000
  }, await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(userPassphrase),
    "PBKDF2",
    false,
    ["deriveBits"]
  ), 256);
  
  // Create backup blob
  const backupBlob = {
    version: 1,
    userId: userId,
    wrappedDEK: currentKey.wrappedDEK,
    originalSalt: currentKey.salt,
    timestamp: Date.now()
  };
  
  // Encrypt backup blob with backup KEK
  const encryptedBackup = await encryptBackupBlob(backupBlob, backupKEK);
  
  // Store backup recovery code
  await storeBackupRecoveryCode({
    userId: userId,
    encryptedBlob: encryptedBackup,
    salt: backupSalt
  });
  
  return {
    recoveryCode: base64url.encode(encryptedBackup),
    hint: "Backup created " + new Date().toISOString()
  };
}
```

## Security Properties

### Cryptographic Guarantees

1. **Confidentiality**: AES-256-GCM provides semantic security
2. **Integrity**: GCM authentication tag prevents tampering
3. **Forward Secrecy**: Key rotation invalidates old keys
4. **Non-Repudiation**: WebAuthn signatures prove authenticity

### Threat Mitigation

| Threat | Mitigation |
|--------|------------|
| Server Compromise | E2E encryption, server never sees plaintext |
| Network Interception | TLS + E2E encryption |
| Client Compromise | Limited plaintext exposure, secure key storage |
| Replay Attacks | WebAuthn challenge-response, fresh IVs |
| Brute Force | WebAuthn biometric/PIN, rate limiting |

### Implementation Security

```javascript
// Secure key material handling
class SecureKeyManager {
  constructor() {
    this.keyCache = new Map();
    this.keyTTL = 30000; // 30 seconds
  }
  
  async getDecryptionKey(userId) {
    const cacheKey = `dek_${userId}`;
    
    if (this.keyCache.has(cacheKey)) {
      const cached = this.keyCache.get(cacheKey);
      if (Date.now() < cached.expires) {
        return cached.key;
      }
      // Clear expired key
      this.clearKey(cacheKey);
    }
    
    // Key not in cache or expired, require re-authentication
    throw new Error("KEY_EXPIRED_REAUTHENTICATION_REQUIRED");
  }
  
  cacheKey(userId, key) {
    const cacheKey = `dek_${userId}`;
    this.keyCache.set(cacheKey, {
      key: key,
      expires: Date.now() + this.keyTTL
    });
    
    // Auto-clear after TTL
    setTimeout(() => this.clearKey(cacheKey), this.keyTTL);
  }
  
  clearKey(cacheKey) {
    if (this.keyCache.has(cacheKey)) {
      const cached = this.keyCache.get(cacheKey);
      // Zero out key material
      if (cached.key) {
        cached.key.fill(0);
      }
      this.keyCache.delete(cacheKey);
    }
  }
  
  clearAllKeys() {
    for (const [key, value] of this.keyCache) {
      if (value.key) {
        value.key.fill(0);
      }
    }
    this.keyCache.clear();
  }
}
```

## Performance Considerations

### Optimization Strategies

1. **Key Caching**: Cache DEK in memory for 30-60 seconds
2. **Batch Operations**: Encrypt/decrypt multiple seeds together
3. **Web Workers**: Perform crypto operations off main thread
4. **Streaming**: Process large datasets incrementally

### Benchmarks (Approximate)

| Operation | Time (ms) | Notes |
|-----------|-----------|--------|
| WebAuthn PRF | 100-500 | Depends on authenticator |
| HKDF Derivation | 1-5 | CPU dependent |
| AES-GCM Encrypt | 0.1-1 | Per TOTP seed |
| AES-GCM Decrypt | 0.1-1 | Per TOTP seed |
| Key Wrapping | 0.5-2 | One-time per session |

This cryptographic design ensures that 2FAir provides state-of-the-art security while maintaining good performance and user experience across all supported devices and browsers. 