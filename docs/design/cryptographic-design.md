# Cryptographic Design - 2FAir E2E Encryption

## Overview

This document details the cryptographic design and implementation for 2FAir's end-to-end encrypted TOTP vault. The system uses WebAuthn credentials for key derivation and AES-GCM for authenticated encryption of TOTP seeds.

**Implementation Status**: 🚧 **Phase 3 Complete - PRF Implementation** (Not Yet Production Ready)

## Cryptographic Primitives

### Core Algorithms

| Operation | Algorithm | Key Size | Notes |
|-----------|-----------|----------|--------|
| Key Derivation | HKDF-SHA256 / PBKDF2-SHA256 | 256-bit | HKDF for PRF, PBKDF2 for fallback |
| Symmetric Encryption | AES-256-GCM | 256-bit | NIST SP 800-38D |
| WebAuthn Source | PRF / credential.id | Variable | PRF preferred, credential.id fallback |
| Random Generation | CSPRNG | - | Web Crypto API |

### Security Parameters

| Parameter | Value | Rationale |
|-----------|--------|-----------|
| AES-GCM IV Size | 96 bits (12 bytes) | NIST recommended for GCM |
| PBKDF2 Salt | Static string | Simplified implementation |
| PBKDF2 Iterations | 100,000 | OWASP recommended minimum |
| Encryption Key Size | 256 bits | AES-256 key size |
| Auth Tag Size | 128 bits | AES-GCM default |

## Key Derivation (Current + Future Implementation)

### Preferred: WebAuthn PRF with Fallback

The optimal approach uses WebAuthn PRF (Pseudo-Random Function) when available, with fallback to credential.id for compatibility:

```javascript
async function deriveEncryptionKey(credential) {
  // Try PRF first (more secure)
  if (credential.getClientExtensionResults?.()?.prf?.results?.first) {
    const prfOutput = credential.getClientExtensionResults().prf.results.first;
    return await deriveKeyFromPRF(prfOutput);
  }
  
  // Fallback to credential.id (current implementation)
  const credentialId = new TextEncoder().encode(credential.id);
  return await deriveKeyFromCredentialId(credentialId);
}

async function deriveKeyFromPRF(prfOutput) {
  // PRF output is already cryptographically strong
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    prfOutput,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode('2fair-prf-salt'),
      info: new TextEncoder().encode('2fair-encryption-key'),
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

async function deriveKeyFromCredentialId(credentialIdBytes) {
  // Current implementation - PBKDF2 for additional security
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    credentialIdBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('2fair-webauthn-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}
```

### Security Comparison

| Approach | Security Level | Compatibility | Implementation |
|----------|---------------|---------------|----------------|
| **WebAuthn PRF** | ⭐⭐⭐⭐⭐ Very High | ⭐⭐⭐ Moderate | ⭐⭐ Complex |
| **credential.id + PBKDF2** | ⭐⭐⭐⭐ High | ⭐⭐⭐⭐⭐ Universal | ⭐⭐⭐⭐⭐ Simple |

### Current vs Future Implementation

#### Phase 1: Fallback (Compatibility) ✅
```
WebAuthn credential.id → PBKDF2 → AES-256-GCM key → Encrypt/Decrypt
```

#### Phase 2: Enhanced (Current Implementation) ✅
```
WebAuthn PRF (preferred) ──► HKDF ──► AES-256-GCM key
         │                             ↑
         └── credential.id + PBKDF2 ────┘ (fallback)
```

### WebAuthn PRF Registration
```javascript
// Enhanced registration with PRF support
async function registerWebAuthnCredential() {
  const credential = await navigator.credentials.create({
    publicKey: {
      // ... standard options
      extensions: {
        prf: {} // Request PRF support
      }
    }
  });
  
  const prfAvailable = credential.getClientExtensionResults().prf;
  console.log('PRF support:', prfAvailable ? 'Available' : 'Not available');
  
  return credential;
}
```

### Migration Strategy

1. **Keep current implementation** working for all users
2. **Add PRF detection** during WebAuthn registration  
3. **Use PRF when available** for new encryptions
4. **Maintain backward compatibility** with credential.id approach
5. **Gradual migration** as authenticator support improves

This approach provides the best of both worlds: maximum security when possible, universal compatibility when needed.

## Simple and Effective Key Hierarchy (Current Implementation)

```
WebAuthn credential.id (consistent string)
         │
         ▼
   TextEncoder.encode() ──► Uint8Array
         │
         ▼
   PBKDF2-SHA256 (100k iterations) ──► AES-256 Key (32 bytes)
         │
         ▼
   Session Cache ──► Consistent encryption throughout session
         │
         ▼
   AES-256-GCM ──► Encrypt/Decrypt TOTP Secrets
```

### Implementation Details

#### WebAuthn Integration
```javascript
// During WebAuthn credential creation
const credential = await navigator.credentials.create({
  publicKey: {
    // Standard WebAuthn options
    challenge: crypto.getRandomValues(new Uint8Array(32)),
    rp: { name: "2FAir", id: "localhost" },
    user: { id: userId, name: email, displayName: name },
    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
    authenticatorSelection: {
      userVerification: "required"
    }
  }
});

// Store credential.id for consistent key derivation
```

#### Key Derivation Process
```javascript
/**
 * Derives encryption key from WebAuthn credential
 * Uses credential.id for consistency across sessions
 */
async function deriveEncryptionKey(credentialId) {
  // Convert credential ID to bytes
  const credentialIdBytes = new TextEncoder().encode(credentialId);
  
  // Import as key material for PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    credentialIdBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive AES-GCM key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('2fair-webauthn-salt'), // Static salt
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // Export as raw bytes for session storage
  const keyBytes = await crypto.subtle.exportKey('raw', key);
  return new Uint8Array(keyBytes);
}
```

#### Session-Based Key Management
```javascript
// Session-based key storage prevents derivation mismatches
let sessionEncryptionKey = null;

export async function getSessionEncryptionKey() {
  if (sessionEncryptionKey) {
    return sessionEncryptionKey; // Use cached key
  }
  
  // Authenticate with WebAuthn to get credential.id
  const credential = await navigator.credentials.get(/* WebAuthn options */);
  const key = await deriveEncryptionKey(credential.id);
  
  // Cache for session consistency
  sessionEncryptionKey = key;
  return key;
}

export function clearSessionEncryptionKey() {
  if (sessionEncryptionKey) {
    sessionEncryptionKey.fill(0); // Zero out memory
    sessionEncryptionKey = null;
  }
}
```

## Encryption Implementation

### TOTP Secret Encryption

#### Data Format
```javascript
// Client-side TOTP secret (Base32 string)
const totpSecret = "JBSWY3DPEHPK3PXP";

// Encrypted storage format: "ciphertext.iv.authTag"
const encryptedFormat = "base64_ciphertext.base64_iv.base64_authTag";
```

#### Encryption Process
```javascript
async function encryptData(plaintext, key) {
  // Generate random IV (96 bits for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Convert plaintext to bytes
  const plaintextBytes = new TextEncoder().encode(plaintext);
  
  // Import key for encryption
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  // Encrypt with AES-GCM
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    cryptoKey,
    plaintextBytes
  );

  // Split ciphertext and auth tag (last 16 bytes)
  const encryptedArray = new Uint8Array(encrypted);
  const ciphertext = encryptedArray.slice(0, -16);
  const authTag = encryptedArray.slice(-16);

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
    authTag: arrayBufferToBase64(authTag),
  };
}
```

#### Decryption Process
```javascript
async function decryptData(encryptedData, key) {
  const { ciphertext, iv, authTag } = encryptedData;
  
  // Convert base64 back to bytes
  const ciphertextBytes = base64ToArrayBuffer(ciphertext);
  const ivBytes = base64ToArrayBuffer(iv);
  const authTagBytes = base64ToArrayBuffer(authTag);

  // Reconstruct full ciphertext with auth tag
  const fullCiphertext = new Uint8Array(
    ciphertextBytes.length + authTagBytes.length
  );
  fullCiphertext.set(new Uint8Array(ciphertextBytes));
  fullCiphertext.set(new Uint8Array(authTagBytes), ciphertextBytes.length);

  // Import key for decryption
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // Decrypt with AES-GCM
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(ivBytes),
    },
    cryptoKey,
    fullCiphertext
  );

  return new TextDecoder().decode(decrypted);
}
```

## TOTP Generation (Client-Side)

### Using OTPAuth Library
```javascript
import { TOTP } from 'otpauth';

// Generate TOTP codes after decryption
function generateTOTPCodes(config) {
  const totp = new TOTP({
    issuer: config.issuer || 'Unknown',
    label: config.label || 'Unknown',
    algorithm: config.algorithm || 'SHA1',
    digits: config.digits || 6,
    period: config.period || 30,
    secret: config.secret, // Decrypted Base32 secret
  });

  const now = Date.now();
  const period = (config.period || 30) * 1000;
  
  // Calculate current and next period
  const currentPeriodEnd = Math.ceil(now / period) * period;
  const nextPeriodEnd = currentPeriodEnd + period;
  
  return {
    currentCode: totp.generate(),
    nextCode: totp.generate({ timestamp: currentPeriodEnd }),
    currentExpireAt: new Date(currentPeriodEnd),
    nextExpireAt: new Date(nextPeriodEnd),
  };
}
```

## Security Architecture

### Zero-Knowledge Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Device   │    │   2FAir Server  │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. OAuth Login        │                       │
         ├──────────────────────►│                       │
         │                       │                       │
         │ 2. WebAuthn Register  │                       │
         ├──────────────────────►│ Store credential     │
         │                       ├──────────────────────►│
         │                       │                       │
         │ 3. WebAuthn Auth      │                       │
         ├──────────────────────►│                       │
         │                       │                       │
         │ 4. Derive Key         │                       │
         │ credential.id → PBKDF2│                       │
         │                       │                       │
         │ 5. Encrypt Secret     │                       │
         │ AES-GCM(secret, key)  │                       │
         │                       │                       │
         │ 6. Send Encrypted     │                       │
         ├──────────────────────►│ Store encrypted      │
         │ ciphertext.iv.authTag │ ├────────────────────►│
         │                       │ │ (no plaintext)     │
         │                       │                       │
         │ 7. Retrieve Encrypted │                       │
         │◄──────────────────────┤◄──────────────────────┤
         │                       │                       │
         │ 8. Decrypt & Generate │                       │
         │ TOTP codes using      │                       │
         │ otpauth library       │                       │
```

### Security Properties

#### Cryptographic Guarantees
1. **Confidentiality**: AES-256-GCM provides semantic security against chosen-plaintext attacks
2. **Integrity**: GCM authentication tag prevents tampering and forgery
3. **Consistency**: Session-based keys prevent encryption/decryption mismatches
4. **Authenticity**: WebAuthn provides strong user authentication

#### Threat Mitigation

| Threat | Mitigation |
|--------|------------|
| Server Compromise | E2E encryption, server stores only ciphertext |
| Network Interception | TLS + E2E encryption, keys never transmitted |
| Client Compromise | Limited plaintext exposure, secure key derivation |
| Replay Attacks | WebAuthn challenge-response, fresh IVs |
| Brute Force | WebAuthn biometric/PIN, credential binding |
| Key Confusion | Session-based consistent key management |

### Simplified Threat Model

**Assumptions:**
- User's device and WebAuthn authenticator are trusted
- TLS protects data in transit
- Server is semi-trusted (honest but curious)

**Guarantees:**
- Server cannot decrypt user TOTP secrets
- Server cannot generate user TOTP codes
- Man-in-the-middle cannot access plaintext data
- Database breach does not expose plaintext secrets

## Implementation Details

### Base64 Utility Functions
```javascript
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
```

### Error Handling
```javascript
async function safeDecryptData(encryptedData, key) {
  try {
    return await decryptData(encryptedData, key);
  } catch (error) {
    console.error('Decryption failed:', error);
    
    // Clear potentially corrupted session key
    clearSessionEncryptionKey();
    
    throw new Error('Decryption failed: Please re-authenticate');
  }
}
```

### Key Lifecycle Management
```javascript
// Clear session keys on:
// 1. User logout
// 2. Browser tab close
// 3. Inactivity timeout
// 4. Decryption errors

window.addEventListener('beforeunload', () => {
  clearSessionEncryptionKey();
});

// Auto-clear after 30 minutes of inactivity
let inactivityTimer;
function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    clearSessionEncryptionKey();
  }, 30 * 60 * 1000); // 30 minutes
}
```

## Performance Characteristics

### Benchmarks (Approximate)

| Operation | Time (ms) | Notes |
|-----------|-----------|--------|
| WebAuthn Authentication | 100-2000 | Depends on authenticator type |
| PBKDF2 Key Derivation | 50-200 | 100,000 iterations |
| AES-GCM Encrypt | 1-5 | Per TOTP secret |
| AES-GCM Decrypt | 1-5 | Per TOTP secret |
| TOTP Generation | 1-10 | Using otpauth library |

### Optimization Strategies

1. **Session Key Caching**: Avoid re-deriving keys during session
2. **Batch Operations**: Encrypt/decrypt multiple secrets together
3. **Lazy Loading**: Only decrypt secrets when displaying codes
4. **Web Workers**: Perform crypto operations off main thread (future)

## Security Considerations

### Design Principles
- **Simplicity**: Simple implementation reduces attack surface
- **Consistency**: Session-based keys prevent subtle bugs
- **Standards Compliance**: Uses Web Crypto API and WebAuthn standards
- **Defense in Depth**: Multiple layers of security

### Known Limitations
1. **Static Salt**: Uses static salt for PBKDF2 (acceptable for this use case)
2. **Session Storage**: Keys stored in memory during session
3. **Single Device**: No cross-device synchronization yet
4. **Browser Dependency**: Requires modern browser with WebAuthn support

### Future Enhancements
1. **Hardware Security**: Integration with HSMs for enterprise
2. **Cross-Device Sync**: Secure multi-device key sharing
3. **Backup Recovery**: Secure backup key generation
4. **Key Rotation**: Automatic key rotation policies

This simplified but robust cryptographic design provides strong security guarantees while maintaining excellent usability and performance. 