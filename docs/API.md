# 2FAir API Documentation

**Status**: ✅ **Phase 3 Complete** (Core Complete, Not Production Ready)  
**Base URL**: `http://localhost:8080` (Dev) | `https://api.2fair.app` (Prod)  

## Authentication

All protected endpoints require JWT token:
```
Authorization: Bearer <jwt_token>
```

## 🔓 Public Endpoints

### GET /v1/public/status
Returns implementation status and features.

**Response:**
```json
{
  "status": "Phase 3 Complete - Core Complete, Not Production Ready",
  "version": "1.0.0",
  "features": {
    "oauth_authentication": true,
    "webauthn_prf": true,
    "zero_knowledge_encryption": true,
    "clean_architecture": true
  }
}
```

## 🔑 Authentication Endpoints

### GET /api/v1/auth/providers
List available OAuth providers.

### GET /api/v1/auth/google
Initiate Google OAuth flow.

### GET /api/v1/auth/google/callback
Handle OAuth callback and create session.

### GET /api/v1/auth/profile
Get authenticated user profile.
- **Headers**: `Authorization: Bearer <token>`

### POST /api/v1/auth/refresh
Refresh JWT token.
- **Headers**: `Authorization: Bearer <token>`

### POST /api/v1/auth/logout
Invalidate user session.
- **Headers**: `Authorization: Bearer <token>`

## 🔐 WebAuthn Endpoints

### POST /api/v1/webauthn/register/begin
Start WebAuthn credential registration with PRF support.
- **Headers**: `Authorization: Bearer <token>`

**Response includes PRF extension:**
```json
{
  "publicKey": {
    "extensions": { "prf": {} },
    "challenge": "base64_challenge",
    // ... standard WebAuthn options
  }
}
```

### POST /api/v1/webauthn/register/finish
Complete WebAuthn registration and extract PRF output.
- **Headers**: `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "id": "credential_id",
  "response": { /* WebAuthn response */ },
  "clientExtensionResults": {
    "prf": { "results": { "first": "base64_prf_output" } }
  }
}
```

## 📱 OTP Management

### GET /api/v1/otp
List user's encrypted TOTP data.
- **Headers**: `Authorization: Bearer <token>`

**Response:**
```json
{
  "otps": [
    {
      "id": "uuid",
      "service_name": "Google",
      "account_identifier": "user@example.com",
      "encrypted_secret": "base64_encrypted_data",
      "algorithm": "SHA1",
      "digits": 6,
      "period": 30
    }
  ]
}
```

### POST /api/v1/otp
Create new encrypted TOTP entry.
- **Headers**: `Authorization: Bearer <token>`

**Request:**
```json
{
  "service_name": "GitHub",
  "account_identifier": "username",
  "encrypted_secret": "base64_encrypted_secret",
  "algorithm": "SHA1",
  "digits": 6,
  "period": 30
}
```

## ❤️ Health Endpoints

### GET /health
Basic health check.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-28T14:30:00Z"
}
```

## 🚨 Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "timestamp": "2025-01-28T14:30:00Z"
  }
}
```

## 🔒 Security Notes

- **Zero-Knowledge**: Server never sees plaintext TOTP secrets
- **Client-side encryption**: AES-256-GCM with WebAuthn PRF key derivation
- **Encrypted format**: `base64(ciphertext || iv || authTag)`
- **PRF fallback**: Uses credential.id + PBKDF2 when PRF unavailable

---

**Next Phase**: Multi-Device Sync & Production Hardening
