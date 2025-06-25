# 2FAir API Documentation

## Overview

2FAir is an end-to-end encrypted TOTP (Time-based One-Time Password) vault with zero-knowledge architecture. This API provides secure authentication and TOTP management capabilities.

**Base URL**: `http://localhost:8080`  
**API Version**: v1  
**Frontend Compatible Endpoints**: `/api/v1/*`
**Implementation Status**: ✅ **Production Ready** (January 2025)

## Architecture

### Zero-Knowledge Principles ✅ IMPLEMENTED
- **Server never sees plaintext TOTP secrets** - All encryption happens client-side
- **Client-side encryption/decryption** using WebAuthn-derived keys
- **TOTP code generation** happens entirely on the client using `otpauth` library
- **Server stores only encrypted data** in `ciphertext.iv.authTag` format
- **Session-based key management** for consistent encryption throughout browser session

### Tech Stack ✅ WORKING
- **Backend**: Go + Gin + PostgreSQL + SQLC + WebAuthn
- **Frontend**: React + TypeScript + HeroUI + TanStack Query + OTPAuth
- **Authentication**: OAuth 2.0 (Google) + WebAuthn biometric/security keys
- **Encryption**: AES-256-GCM + PBKDF2 key derivation
- **TOTP Generation**: Client-side using `otpauth` npm package

## Authentication Flow ✅ IMPLEMENTED

```
1. OAuth Login (Google) → JWT Token → User Account Created
2. WebAuthn Registration → Biometric/Hardware Key → Credential Stored
3. WebAuthn Authentication → Derived Encryption Key → Session Key Cached
4. Client-side TOTP Management → E2E Encrypted Storage → Real-time Code Generation
```

## API Endpoints

### Authentication

#### Get User Profile ✅ WORKING
```http
GET /api/v1/auth/me
Authorization: Bearer <jwt_token>
```
**Response:**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "User Name",
  "picture": "https://avatar-url"
}
```

#### OAuth Login ✅ WORKING
```http
GET /api/v1/auth/google
```
**Response:** Redirects to Google OAuth

#### OAuth Callback ✅ WORKING
```http
GET /api/v1/auth/google/callback
```
**Response:** Redirects to frontend with JWT token

#### Logout ✅ WORKING
```http
POST /api/v1/auth/logout
Authorization: Bearer <jwt_token>
```

### WebAuthn ✅ IMPLEMENTED

#### Begin Registration
```http
POST /api/v1/webauthn/register/begin
Authorization: Bearer <jwt_token>
```
**Response:**
```json
{
  "publicKey": {
    "challenge": "base64url-challenge",
    "rp": {"id": "localhost", "name": "2FAir"},
    "user": {"id": "base64url-user-id", "name": "user@example.com"},
    "pubKeyCredParams": [{"type": "public-key", "alg": -7}],
    "timeout": 60000,
    "authenticatorSelection": {
      "userVerification": "required"
    }
  }
}
```

#### Finish Registration ✅ WORKING
```http
POST /api/v1/webauthn/register/finish
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "id": "credential-id",
  "rawId": "base64url-raw-id", 
  "response": {
    "attestationObject": "base64url-attestation",
    "clientDataJSON": "base64url-client-data"
  },
  "type": "public-key"
}
```
**Response:**
```json
{
  "success": true,
  "message": "WebAuthn credential registered successfully"
}
```

#### Begin Authentication ✅ WORKING
```http
POST /api/v1/webauthn/authenticate/begin
Authorization: Bearer <jwt_token>
```
**Response:**
```json
{
  "publicKey": {
    "challenge": "base64url-challenge",
    "allowCredentials": [
      {
        "id": "base64url-credential-id",
        "type": "public-key"
      }
    ],
    "timeout": 60000,
    "userVerification": "required"
  }
}
```

#### Finish Authentication ✅ WORKING
```http
POST /api/v1/webauthn/authenticate/finish
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "id": "credential-id",
  "rawId": "base64url-raw-id",
  "response": {
    "authenticatorData": "base64url-auth-data",
    "clientDataJSON": "base64url-client-data",
    "signature": "base64url-signature",
    "userHandle": "base64url-user-handle"
  },
  "type": "public-key"
}
```
**Response:**
```json
{
  "success": true,
  "message": "WebAuthn authentication successful"
}
```

#### Get Credentials ✅ WORKING
```http
GET /api/v1/webauthn/credentials
Authorization: Bearer <jwt_token>
```
**Response:**
```json
[
  {
    "id": "credential-id",
    "name": "Touch ID",
    "createdAt": "2025-01-07T10:00:00Z"
  }
]
```

#### Delete Credential ✅ WORKING
```http
DELETE /api/v1/webauthn/credentials/:id
Authorization: Bearer <jwt_token>
```

### TOTP Management ✅ IMPLEMENTED

#### Create OTP Entry
```http
POST /api/v1/otp
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "issuer": "GitHub",
  "label": "user@example.com", 
  "secret": "ENCRYPTED_SECRET_CIPHERTEXT.IV.AUTHTAG",
  "algorithm": "SHA1",
  "digits": 6,
  "period": 30
}
```
**Note:** The `secret` field contains the client-side encrypted TOTP secret in the format `ciphertext.iv.authTag` (base64 encoded components).

**Response:**
```json
{
  "id": "otp-uuid",
  "issuer": "GitHub",
  "label": "user@example.com",
  "secret": "ENCRYPTED_SECRET_CIPHERTEXT.IV.AUTHTAG",
  "algorithm": "SHA1",
  "digits": 6,
  "period": 30,
  "createdAt": "2025-01-07T10:00:00Z",
  "updatedAt": "2025-01-07T10:00:00Z"
}
```

#### List OTP Entries ✅ WORKING
```http
GET /api/v1/otp
Authorization: Bearer <jwt_token>
```
**Response:**
```json
[
  {
    "id": "otp-uuid",
    "issuer": "GitHub",
    "label": "user@example.com",
    "secret": "ENCRYPTED_SECRET_CIPHERTEXT.IV.AUTHTAG", 
    "algorithm": "SHA1",
    "digits": 6,
    "period": 30,
    "createdAt": "2025-01-07T10:00:00Z",
    "updatedAt": "2025-01-07T10:00:00Z"
  }
]
```

#### Update OTP Entry ✅ WORKING
```http
PUT /api/v1/otp/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "issuer": "Updated Issuer",
  "label": "updated@example.com",
  "secret": "NEW_ENCRYPTED_SECRET_CIPHERTEXT.IV.AUTHTAG",
  "algorithm": "SHA256",
  "digits": 6,
  "period": 30
}
```

#### Inactivate OTP Entry ✅ WORKING
```http
POST /api/v1/otp/:id/inactivate
Authorization: Bearer <jwt_token>
```
**Response:**
```json
{
  "message": "OTP inactivated successfully"
}
```

### System

#### Health Check ✅ WORKING
```http
GET /health
```
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-07T10:00:00Z"
}
```

## Security Implementation

### Client-Side Encryption Process ✅ IMPLEMENTED
```javascript
// 1. WebAuthn authentication derives encryption key
const encryptionKey = await authenticateWebAuthn();

// 2. TOTP secret encrypted client-side using AES-256-GCM
const encryptedData = await encryptData(totpSecret, encryptionKey);

// 3. Encrypted data formatted as "ciphertext.iv.authTag"
const secretForServer = `${encryptedData.ciphertext}.${encryptedData.iv}.${encryptedData.authTag}`;

// 4. Send to server (server never sees plaintext)
await createOTP({ issuer, label, secret: secretForServer });
```

### Client-Side TOTP Generation ✅ IMPLEMENTED
```javascript
// 1. Retrieve encrypted TOTP secrets from server
const otps = await fetchOTPs();

// 2. Decrypt secrets client-side
const decryptedSecret = await decryptData(encryptedData, encryptionKey);

// 3. Generate TOTP codes using otpauth library
import { TOTP } from 'otpauth';
const totp = new TOTP({ secret: decryptedSecret });
const currentCode = totp.generate();
```

### Zero-Knowledge Guarantees
- **Server never receives plaintext TOTP secrets**
- **Server never receives or generates TOTP codes**
- **All encryption/decryption happens client-side**
- **Keys derived from WebAuthn credentials, never transmitted**
- **Consistent session keys prevent encryption/decryption mismatches**

## Error Responses ✅ IMPLEMENTED

### Common Error Format
```json
{
  "error": "error message",
  "details": "detailed error information"
}
```

### Status Codes
- `200` - Success
- `201` - Created successfully  
- `400` - Bad request (validation error)
- `401` - Authentication required
- `403` - Forbidden 
- `404` - Not found
- `500` - Internal server error

### WebAuthn Specific Errors
- `400` - "WebAuthn not supported" - Browser lacks WebAuthn support
- `400` - "No credentials found" - User needs to register WebAuthn credential
- `400` - "Authentication failed" - WebAuthn verification failed
- `500` - "Registration failed" - Server-side WebAuthn processing error

## Rate Limiting ✅ CONFIGURED

- **Authentication endpoints**: 10 requests/minute per IP
- **TOTP operations**: 100 requests/minute per user
- **WebAuthn operations**: 20 requests/minute per user

## Development

### Environment Variables
```bash
# Server Configuration
SERVER_HOST=localhost
SERVER_PORT=8080
ENVIRONMENT=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=2fair
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SIGNING_KEY=your-secret-key-here
JWT_EXPIRY=24h

# WebAuthn Configuration
WEBAUTHN_RP_DISPLAY_NAME=2FAir
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_ORIGINS=http://localhost:5173,http://localhost:8080
WEBAUTHN_TIMEOUT=60s

# OAuth Configuration (Google)
OAUTH_GOOGLE_CLIENT_ID=your-google-client-id
OAUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret
OAUTH_GOOGLE_REDIRECT_URL=http://localhost:8080/api/v1/auth/google/callback
```

### Frontend Environment
```bash
# Vite Configuration
VITE_SERVER_URL=http://localhost:8080
```

## Client Libraries Used ✅ IMPLEMENTED

### Frontend Dependencies
- **`otpauth`** - Industry-standard TOTP generation library
- **`@heroui/react`** - Modern UI component library
- **`@tanstack/react-query`** - Server state management
- **`zustand`** - Client state management 
- **`react`** + **`typescript`** - Type-safe React development

### Security Libraries
- **WebAuthn API** (built into browsers) - Hardware security integration
- **Web Crypto API** (built into browsers) - Cryptographic operations
- **PBKDF2** - Key derivation from WebAuthn credentials
- **AES-256-GCM** - Authenticated encryption of TOTP secrets

## Migration from Server-Side TOTP

### ❌ Removed Endpoints
The following endpoint has been **removed** as part of the zero-knowledge architecture:

```http
❌ GET /api/v1/otp/codes - Server-side TOTP generation (REMOVED)
```

**Why removed:** Violates zero-knowledge principles. TOTP code generation now happens entirely client-side using the `otpauth` library.

### ✅ Client-Side Alternative
Instead of server-side code generation, use:

```javascript
import { generateTOTPCodes } from '../lib/totp';

// Generate codes client-side
const codes = generateTOTPCodes({
  secret: decryptedSecret,
  algorithm: 'SHA1',
  digits: 6,
  period: 30
});

console.log('Current code:', codes.currentCode);
console.log('Next code:', codes.nextCode);
```

This ensures true end-to-end encryption where the server never sees your TOTP secrets or codes. 