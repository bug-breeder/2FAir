# 2FAir API Documentation

## Overview

2FAir is an end-to-end encrypted TOTP (Time-based One-Time Password) vault with zero-knowledge architecture. This API provides secure authentication and TOTP management capabilities.

**Base URL**: `http://localhost:8080`  
**API Version**: v1  
**Frontend Compatible Endpoints**: `/api/v1/*`
**Implementation Status**: Phase 3 Complete ✅ (December 2024)

## Architecture

### Zero-Knowledge Principles
- **Server never sees plaintext TOTP secrets** ✅ IMPLEMENTED
- **Client-side encryption/decryption** using WebAuthn-derived keys ✅ IMPLEMENTED
- **TOTP code generation** happens entirely on the client ✅ IMPLEMENTED
- **Server stores only encrypted data** ✅ IMPLEMENTED

### Tech Stack
- **Backend**: Go + Gin + PostgreSQL + SQLC
- **Frontend**: React + TypeScript + HeroUI + TanStack Query ✅ COMPLETE
- **Authentication**: OAuth 2.0 + WebAuthn ✅ WORKING
- **Encryption**: AES-256-GCM + PBKDF2 ✅ IMPLEMENTED

## Authentication Flow

```
1. OAuth Login (Google/GitHub) → JWT Token ✅ WORKING
2. WebAuthn Registration → Biometric/Hardware Key ✅ IMPLEMENTED
3. WebAuthn Authentication → Derived Encryption Key ✅ READY
4. Client-side TOTP Management → E2E Encrypted Storage ✅ COMPLETE
```

## API Endpoints

### Authentication

#### Get OAuth Providers
```http
GET /api/v1/auth/providers
```
**Response:**
```json
{
  "providers": [
    {
      "name": "Google",
      "provider": "google", 
      "description": "Sign in with Google",
      "login_url": "http://localhost:8080/api/v1/auth/google"
    }
  ]
}
```

#### OAuth Login
```http
GET /api/v1/auth/:provider
```
**Parameters:**
- `provider`: `google` | `github`

**Response:** Redirects to OAuth provider

#### OAuth Callback
```http
GET /api/v1/auth/:provider/callback
```
**Note:** Updated to `/api/v1/*` for consistency with all frontend routes

#### Get User Profile
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

#### Refresh Token
```http
POST /api/v1/auth/refresh
```

#### Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer <jwt_token>
```

### WebAuthn

#### Begin Registration
```http
POST /api/v1/webauthn/register/begin
Authorization: Bearer <jwt_token>
```
**Response:**
```json
{
  "publicKey": {
    "challenge": "base64-challenge",
    "rp": {"id": "localhost", "name": "2FAir"},
    "user": {"id": "user-id", "name": "user@example.com"},
    "pubKeyCredParams": [{"type": "public-key", "alg": -7}],
    "timeout": 60000
  }
}
```

#### Finish Registration
```http
POST /api/v1/webauthn/register/finish
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "id": "credential-id",
  "rawId": "base64-raw-id", 
  "response": {
    "attestationObject": "base64-attestation",
    "clientDataJSON": "base64-client-data"
  },
  "type": "public-key"
}
```

#### Begin Authentication
```http
POST /api/v1/webauthn/authenticate/begin
Authorization: Bearer <jwt_token>
```

#### Finish Authentication
```http
POST /api/v1/webauthn/authenticate/finish
Authorization: Bearer <jwt_token>
```

#### Get Credentials
```http
GET /api/v1/webauthn/credentials
Authorization: Bearer <jwt_token>
```

#### Delete Credential
```http
DELETE /api/v1/webauthn/credentials/:id
Authorization: Bearer <jwt_token>
```

### TOTP Management

#### Create OTP Entry
```http
POST /api/v1/otp
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "Issuer": "GitHub",
  "Label": "user@example.com", 
  "Secret": "ENCRYPTED_SECRET_BASE64",
  "Algorithm": "SHA1",
  "Digits": 6,
  "Period": 30
}
```

#### List OTP Entries
```http
GET /api/v1/otp
Authorization: Bearer <jwt_token>
```
**Response:**
```json
[
  {
    "Id": "otp-uuid",
    "Issuer": "GitHub",
    "Label": "user@example.com",
    "Secret": "ENCRYPTED_SECRET_BASE64", 
    "Algorithm": "SHA1",
    "Digits": 6,
    "Period": 30,
    "CreatedAt": "2024-01-01T00:00:00Z",
    "UpdatedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### Update OTP Entry
```http
PUT /api/v1/otp/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "Issuer": "Updated Issuer",
  "Label": "updated@example.com"
}
```

#### Inactivate OTP Entry
```http
POST /api/v1/otp/:id/inactivate
Authorization: Bearer <jwt_token>
```

### System

#### Health Check
```http
GET /health
```

#### Vault Status
```http
GET /api/v1/vault/status
Authorization: Bearer <jwt_token>
```

#### Public Status
```http
GET /v1/public/status
```

## Security Considerations

### Encryption
- **AES-256-GCM** for symmetric encryption
- **PBKDF2** for key derivation from WebAuthn
- **Random IV** for each encryption operation
- **Authentication tags** prevent tampering

### Zero-Knowledge
- Server **never receives plaintext TOTP secrets**
- Client encrypts secrets before sending to server
- TOTP codes generated client-side using `otpauth` library
- Decryption keys derived from WebAuthn credentials

### Authentication
- **JWT tokens** for API authentication
- **WebAuthn** for hardware-backed security
- **OAuth 2.0** for initial user authentication
- **CORS** properly configured for frontend

## Error Responses

```json
{
  "error": "authentication required",
  "statusCode": 401
}
```

**Common Status Codes:**
- `200` - Success
- `401` - Authentication required
- `403` - Forbidden 
- `404` - Not found
- `422` - Validation error
- `500` - Internal server error

## Rate Limiting

- **Authentication endpoints**: 10 requests/minute
- **TOTP operations**: 100 requests/minute  
- **WebAuthn operations**: 20 requests/minute

## Development

### Environment Variables
```bash
# Server
SERVER_HOST=localhost
SERVER_PORT=8080
ENVIRONMENT=development

# Database  
DB_HOST=localhost
DB_PORT=5432
DB_NAME=2fair
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SIGNING_KEY=your-secret-key

# WebAuthn
WEBAUTHN_RP_DISPLAY_NAME=2FAir
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_ORIGINS=http://localhost:5173,http://localhost:8080
WEBAUTHN_TIMEOUT=60s

# OAuth (configure with actual credentials)
OAUTH_GOOGLE_ENABLED=false
OAUTH_GITHUB_ENABLED=false
```

### Frontend Environment
```bash
VITE_SERVER_URL=http://localhost:8080
```

## Client Libraries

The frontend uses these key libraries for TOTP:
- **`otpauth`** - Client-side TOTP generation
- **`@heroui/react`** - UI components
- **`@tanstack/react-query`** - API state management
- **`zustand`** - Global state management 