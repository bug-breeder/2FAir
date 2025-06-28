# 2FAir API Documentation

**Version**: v1  
**Status**: ✅ **Phase 3 Complete - Clean Architecture + PRF Implementation**  
**Base URL**: `http://localhost:8080` (Development) | `https://api.2fair.com` (Production)  
**Last Updated**: January 2025

## Overview

The 2FAir API provides secure, zero-knowledge TOTP (Time-based One-Time Password) management with end-to-end encryption. Built with clean architecture principles, the API ensures that the server never sees plaintext TOTP secrets while providing a robust, scalable interface for authentication and OTP management.

## 🔐 Authentication

### Authentication Flow

2FAir uses a hybrid authentication system combining OAuth 2.0 and WebAuthn:

1. **OAuth Authentication**: Google OAuth for user identification
2. **JWT Sessions**: Secure session management with JWT tokens
3. **WebAuthn Security**: Hardware-backed key derivation for encryption keys

### Authentication Header

For protected endpoints, include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## 📋 API Endpoints

### Base Paths

- **Public Endpoints**: `/v1/public/*` - No authentication required
- **Auth Endpoints**: `/api/v1/auth/*` - Authentication management
- **Protected Endpoints**: `/api/v1/*` - Require valid JWT token
- **Health Endpoints**: `/health/*` - System health and status

## 🔓 Public Endpoints

### Get Implementation Status
```http
GET /v1/public/status
```

**Description**: Returns the current implementation status and version information.

**Response**:
```json
{
  "status": "Phase 3 Complete - Clean Architecture + PRF Implementation",
  "version": "1.0.0",
  "features": {
    "oauth_authentication": true,
    "webauthn_prf": true,
    "zero_knowledge_encryption": true,
    "clean_architecture": true
  },
  "environment": "development"
}
```

## 🔑 Authentication Endpoints

### List OAuth Providers
```http
GET /api/v1/auth/providers
```

**Description**: Get available OAuth authentication providers.

**Response**:
```json
{
  "providers": [
    {
      "name": "google",
      "display_name": "Google",
      "auth_url": "/api/v1/auth/google",
      "enabled": true
    }
  ]
}
```

### Google OAuth Login
```http
GET /api/v1/auth/google
```

**Description**: Initiate Google OAuth authentication flow.

**Response**: Redirects to Google OAuth consent screen.

### Google OAuth Callback
```http
GET /api/v1/auth/google/callback?code={code}&state={state}
```

**Description**: Handle Google OAuth callback and create user session.

**Parameters**:
- `code` (query, required): OAuth authorization code
- `state` (query, required): OAuth state parameter

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "John Doe",
    "username": "johndoe"
  },
  "token": "jwt_token_here",
  "expires_at": "2025-01-29T14:30:00Z"
}
```

### Get User Profile
```http
GET /api/v1/auth/profile
```

**Description**: Get the authenticated user's profile information.

**Headers**: `Authorization: Bearer <jwt_token>`

**Response**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "display_name": "John Doe",
  "username": "johndoe",
  "created_at": "2025-01-15T10:30:00Z",
  "oauth_provider": "google"
}
```

### Refresh JWT Token
```http
POST /api/v1/auth/refresh
```

**Description**: Refresh an expired or near-expired JWT token.

**Headers**: `Authorization: Bearer <jwt_token>`

**Response**:
```json
{
  "token": "new_jwt_token_here",
  "expires_at": "2025-01-29T14:30:00Z"
}
```

### Logout
```http
POST /api/v1/auth/logout
```

**Description**: Invalidate the current user session.

**Headers**: `Authorization: Bearer <jwt_token>`

**Response**:
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

## 🔐 WebAuthn Endpoints

### Begin WebAuthn Registration
```http
POST /api/v1/webauthn/register/begin
```

**Description**: Start WebAuthn credential registration with PRF extension support.

**Headers**: `Authorization: Bearer <jwt_token>`

**Response**:
```json
{
  "publicKey": {
    "challenge": "base64_challenge",
    "rp": {
      "id": "localhost",
      "name": "2FAir"
    },
    "user": {
      "id": "base64_user_id",
      "name": "user@example.com",
      "displayName": "John Doe"
    },
    "pubKeyCredParams": [
      {"type": "public-key", "alg": -7},
      {"type": "public-key", "alg": -257}
    ],
    "authenticatorSelection": {
      "authenticatorAttachment": "platform",
      "userVerification": "required"
    },
    "extensions": {
      "prf": {}
    },
    "timeout": 60000
  }
}
```

### Finish WebAuthn Registration
```http
POST /api/v1/webauthn/register/finish
```

**Description**: Complete WebAuthn credential registration and extract PRF output.

**Headers**: 
- `Authorization: Bearer <jwt_token>`
- `Content-Type: application/json`

**Request Body**:
```json
{
  "id": "credential_id",
  "rawId": "base64_raw_id",
  "type": "public-key",
  "response": {
    "attestationObject": "base64_attestation_object",
    "clientDataJSON": "base64_client_data_json"
  },
  "clientExtensionResults": {
    "prf": {
      "results": {
        "first": "base64_prf_output"
      }
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "credential": {
    "id": "uuid",
    "credential_id": "base64_credential_id",
    "created_at": "2025-01-28T14:30:00Z"
  },
  "prf_output": "base64_prf_output",
  "supports_prf": true
}
```

## 📱 OTP Management Endpoints

### List User OTPs
```http
GET /api/v1/otp
```

**Description**: Get all TOTP seeds for the authenticated user (encrypted data only).

**Headers**: `Authorization: Bearer <jwt_token>`

**Response**:
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
      "period": 30,
      "issuer": "Google",
      "icon_url": "https://example.com/icon.png",
      "created_at": "2025-01-28T14:30:00Z",
      "updated_at": "2025-01-28T14:30:00Z"
    }
  ],
  "count": 1
}
```

### Create New OTP
```http
POST /api/v1/otp
```

**Description**: Create a new TOTP seed with encrypted secret.

**Headers**: 
- `Authorization: Bearer <jwt_token>`
- `Content-Type: application/json`

**Request Body**:
```json
{
  "service_name": "GitHub",
  "account_identifier": "johndoe",
  "encrypted_secret": "base64_encrypted_secret",
  "algorithm": "SHA1",
  "digits": 6,
  "period": 30,
  "issuer": "GitHub",
  "icon_url": "https://github.com/favicon.ico"
}
```

**Response**:
```json
{
  "id": "uuid",
  "service_name": "GitHub",
  "account_identifier": "johndoe",
  "encrypted_secret": "base64_encrypted_secret",
  "algorithm": "SHA1",
  "digits": 6,
  "period": 30,
  "issuer": "GitHub",
  "icon_url": "https://github.com/favicon.ico",
  "created_at": "2025-01-28T14:30:00Z",
  "updated_at": "2025-01-28T14:30:00Z"
}
```

## ❤️ Health & Status Endpoints

### Application Health Check
```http
GET /health
```

**Description**: Basic application health check.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-28T14:30:00Z",
  "environment": "development",
  "version": "1.0.0"
}
```

## 🚨 Error Handling

### Standard Error Response Format

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": "service_name is required",
    "timestamp": "2025-01-28T14:30:00Z",
    "path": "/api/v1/otp"
  }
}
```

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data or parameters
- `401 Unauthorized` - Authentication required or invalid
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## 🔒 Security Considerations

### Zero-Knowledge Architecture

**Important**: The server never receives or stores plaintext TOTP secrets. All encryption/decryption happens client-side:

1. **Client-side encryption**: TOTP secrets encrypted with AES-256-GCM before sending to server
2. **Server storage**: Only encrypted blobs stored as `base64_encrypted_data`
3. **Key derivation**: WebAuthn PRF (preferred) or credential.id PBKDF2 (fallback)
4. **Session security**: Encryption keys cached client-side only

### Data Format

Encrypted TOTP secrets are stored in the format:
```
base64_encrypted_data = base64(ciphertext || iv || authTag)
```

## 🧪 Testing the API

### Authentication Flow Example

```bash
# 1. Get OAuth providers
curl http://localhost:8080/api/v1/auth/providers

# 2. Initiate OAuth (redirect to Google)
open http://localhost:8080/api/v1/auth/google

# 3. After OAuth callback, use JWT token
export JWT_TOKEN="your_jwt_token_here"

# 4. Get user profile
curl -H "Authorization: Bearer $JWT_TOKEN" \
     http://localhost:8080/api/v1/auth/profile

# 5. List OTPs (empty initially)
curl -H "Authorization: Bearer $JWT_TOKEN" \
     http://localhost:8080/api/v1/otp
```

---

**API Status**: ✅ **Phase 3 Complete - Clean Architecture + PRF Implementation**  
**Next Phase**: Multi-Device Synchronization & Production Hardening
