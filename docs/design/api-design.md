# API Design - 2FAir E2E Encrypted TOTP Vault

API design document for the E2E encrypted TOTP vault system.

## Overview

This document describes the REST API design for 2FAir's end-to-end encrypted TOTP vault. The API is designed to support WebAuthn authentication, encrypted data synchronization, and zero-knowledge architecture while maintaining security and performance.

## API Design Principles

### Security-First
- **Zero-Knowledge**: Server never receives plaintext TOTP seeds
- **WebAuthn Only**: No password-based authentication
- **E2E Encryption**: All sensitive data encrypted client-side
- **Rate Limiting**: Protection against abuse and attacks
- **Audit Logging**: Comprehensive security event logging

### RESTful Design
- **Resource-Oriented**: Clear resource hierarchy and naming
- **HTTP Methods**: Proper use of GET, POST, PUT, DELETE
- **Status Codes**: Meaningful HTTP status codes
- **Consistent Format**: Standardized request/response structure
- **Pagination**: Cursor-based pagination for large datasets

### Performance & Scalability
- **Stateless**: No server-side session state
- **Cacheable**: Appropriate cache headers
- **Efficient Sync**: Delta-based synchronization
- **Compression**: gzip/brotli compression support

## Base Configuration

### API Base URL
```
Production: https://api.2fair.dev/v1
Development: https://api-dev.2fair.dev/v1
Local: http://localhost:8080/v1
```

### Content Types
- **Request**: `application/json` with UTF-8 encoding
- **Response**: `application/json` with UTF-8 encoding
- **Binary Data**: Base64 encoded within JSON

### Authentication
All authenticated endpoints require a valid WebAuthn session token:
```http
Authorization: Bearer <jwt_token>
X-Device-ID: <stable_device_identifier>
```

## API Endpoints

### Authentication Endpoints

#### POST /auth/webauthn/register/begin
Begin WebAuthn registration process.

**Request:**
```json
{
  "username": "user@example.com",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "challengeId": "challenge-uuid",
  "publicKeyCredentialCreationOptions": {
    "challenge": "base64-encoded-challenge",
    "rp": {
      "name": "2FAir",
      "id": "2fair.dev"
    },
    "user": {
      "id": "base64-encoded-user-id",
      "name": "user@example.com",
      "displayName": "John Doe"
    },
    "pubKeyCredParams": [
      {"alg": -7, "type": "public-key"},
      {"alg": -257, "type": "public-key"}
    ],
    "authenticatorSelection": {
      "userVerification": "required",
      "residentKey": "preferred"
    },
    "extensions": {
      "prf": {}
    }
  }
}
```

#### POST /auth/webauthn/register/complete
Complete WebAuthn registration.

**Request:**
```json
{
  "challengeId": "challenge-uuid",
  "credential": {
    "id": "credential-id",
    "rawId": "base64-raw-id",
    "response": {
      "clientDataJSON": "base64-client-data",
      "attestationObject": "base64-attestation"
    },
    "getClientExtensionResults": {
      "prf": true
    }
  },
  "initialEncryptionKey": {
    "wrappedDEK": "base64-wrapped-dek",
    "salt": "base64-salt"
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "username": "user@example.com",
    "displayName": "John Doe",
    "createdAt": "2025-01-07T10:00:00Z"
  },
  "token": "jwt-token",
  "expiresAt": "2025-01-07T11:00:00Z"
}
```

#### POST /auth/webauthn/authenticate/begin
Begin WebAuthn authentication.

**Request:**
```json
{
  "username": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "challengeId": "challenge-uuid",
  "publicKeyCredentialRequestOptions": {
    "challenge": "base64-challenge",
    "allowCredentials": [
      {
        "id": "base64-credential-id",
        "type": "public-key"
      }
    ],
    "userVerification": "required",
    "extensions": {
      "prf": {
        "eval": {
          "first": "base64-prf-input"
        }
      }
    }
  }
}
```

#### POST /auth/webauthn/authenticate/complete
Complete WebAuthn authentication.

**Request:**
```json
{
  "challengeId": "challenge-uuid",
  "credential": {
    "id": "credential-id",
    "rawId": "base64-raw-id",
    "response": {
      "clientDataJSON": "base64-client-data",
      "authenticatorData": "base64-authenticator-data",
      "signature": "base64-signature"
    },
    "getClientExtensionResults": {
      "prf": {
        "results": {
          "first": "base64-prf-output"
        }
      }
    }
  },
  "deviceInfo": {
    "deviceId": "stable-device-id",
    "deviceName": "iPhone 15 Pro",
    "deviceType": "mobile",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "username": "user@example.com",
    "displayName": "John Doe"
  },
  "encryptionKey": {
    "wrappedDEK": "base64-wrapped-dek",
    "salt": "base64-salt",
    "version": 1
  },
  "token": "jwt-token",
  "expiresAt": "2025-01-07T11:00:00Z"
}
```

#### POST /auth/refresh
Refresh authentication token.

**Headers:**
```http
Authorization: Bearer <current_token>
```

**Response:**
```json
{
  "success": true,
  "token": "new-jwt-token",
  "expiresAt": "2025-01-07T12:00:00Z"
}
```

#### POST /auth/logout
Logout and invalidate session.

**Headers:**
```http
Authorization: Bearer <jwt_token>
X-Device-ID: <device_id>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### TOTP Vault Endpoints

#### GET /vault/seeds
Get encrypted TOTP seeds for user.

**Headers:**
```http
Authorization: Bearer <jwt_token>
X-Device-ID: <device_id>
```

**Query Parameters:**
- `since` (optional): RFC3339 timestamp for delta sync
- `limit` (optional): Maximum number of results (default: 100)
- `cursor` (optional): Pagination cursor

**Response:**
```json
{
  "success": true,
  "seeds": [
    {
      "id": "seed-uuid",
      "issuer": "Google",
      "accountName": "user@gmail.com",
      "iconUrl": "https://cdn.2fair.dev/icons/google.png",
      "tags": ["work", "email"],
      "encryptedData": {
        "ciphertext": "base64-ciphertext",
        "iv": "base64-iv",
        "authTag": "base64-auth-tag"
      },
      "keyVersion": 1,
      "createdAt": "2025-01-07T10:00:00Z",
      "updatedAt": "2025-01-07T10:00:00Z"
    }
  ],
  "pagination": {
    "hasMore": false,
    "nextCursor": null
  },
  "syncTimestamp": "2025-01-07T10:30:00Z"
}
```

#### POST /vault/seeds
Create new encrypted TOTP seed.

**Request:**
```json
{
  "issuer": "GitHub",
  "accountName": "user@example.com",
  "iconUrl": "https://cdn.2fair.dev/icons/github.png",
  "tags": ["work", "development"],
  "encryptedData": {
    "ciphertext": "base64-ciphertext",
    "iv": "base64-iv",
    "authTag": "base64-auth-tag"
  }
}
```

**Response:**
```json
{
  "success": true,
  "seed": {
    "id": "seed-uuid",
    "issuer": "GitHub",
    "accountName": "user@example.com",
    "iconUrl": "https://cdn.2fair.dev/icons/github.png",
    "tags": ["work", "development"],
    "encryptedData": {
      "ciphertext": "base64-ciphertext",
      "iv": "base64-iv",
      "authTag": "base64-auth-tag"
    },
    "keyVersion": 1,
    "createdAt": "2025-01-07T10:00:00Z",
    "updatedAt": "2025-01-07T10:00:00Z"
  }
}
```

#### PUT /vault/seeds/{seedId}
Update existing encrypted TOTP seed.

**Request:**
```json
{
  "issuer": "GitHub Enterprise",
  "accountName": "user@company.com",
  "iconUrl": "https://cdn.2fair.dev/icons/github.png",
  "tags": ["work", "enterprise"],
  "encryptedData": {
    "ciphertext": "base64-new-ciphertext",
    "iv": "base64-new-iv",
    "authTag": "base64-new-auth-tag"
  }
}
```

**Response:**
```json
{
  "success": true,
  "seed": {
    "id": "seed-uuid",
    "issuer": "GitHub Enterprise",
    "accountName": "user@company.com",
    "iconUrl": "https://cdn.2fair.dev/icons/github.png",
    "tags": ["work", "enterprise"],
    "encryptedData": {
      "ciphertext": "base64-new-ciphertext",
      "iv": "base64-new-iv",
      "authTag": "base64-new-auth-tag"
    },
    "keyVersion": 1,
    "createdAt": "2025-01-07T10:00:00Z",
    "updatedAt": "2025-01-07T10:30:00Z"
  }
}
```

#### DELETE /vault/seeds/{seedId}
Delete TOTP seed.

**Response:**
```json
{
  "success": true,
  "message": "TOTP seed deleted successfully"
}
```

#### GET /vault/seeds/search
Search TOTP seeds by metadata.

**Query Parameters:**
- `q`: Search query
- `limit` (optional): Maximum results (default: 50)
- `cursor` (optional): Pagination cursor

**Response:**
```json
{
  "success": true,
  "query": "google",
  "seeds": [
    {
      "id": "seed-uuid",
      "issuer": "Google",
      "accountName": "user@gmail.com",
      "iconUrl": "https://cdn.2fair.dev/icons/google.png",
      "tags": ["personal", "email"],
      "encryptedData": {
        "ciphertext": "base64-ciphertext",
        "iv": "base64-iv",
        "authTag": "base64-auth-tag"
      },
      "keyVersion": 1,
      "createdAt": "2025-01-07T10:00:00Z",
      "updatedAt": "2025-01-07T10:00:00Z"
    }
  ],
  "pagination": {
    "hasMore": false,
    "nextCursor": null
  }
}
```

### Device Management Endpoints

#### GET /devices
Get user's registered devices.

**Response:**
```json
{
  "success": true,
  "devices": [
    {
      "id": "device-session-uuid",
      "deviceId": "stable-device-id",
      "deviceName": "iPhone 15 Pro",
      "deviceType": "mobile",
      "lastSyncAt": "2025-01-07T10:30:00Z",
      "createdAt": "2025-01-07T09:00:00Z",
      "expiresAt": "2025-01-14T09:00:00Z",
      "isActive": true,
      "isCurrent": true
    }
  ]
}
```

#### POST /devices/register
Register new device for sync.

**Request:**
```json
{
  "deviceId": "new-device-id",
  "deviceName": "MacBook Pro",
  "deviceType": "desktop",
  "expirationHours": 168
}
```

**Response:**
```json
{
  "success": true,
  "device": {
    "id": "device-session-uuid",
    "deviceId": "new-device-id",
    "deviceName": "MacBook Pro",
    "deviceType": "desktop",
    "lastSyncAt": "2025-01-07T10:30:00Z",
    "createdAt": "2025-01-07T10:30:00Z",
    "expiresAt": "2025-01-14T10:30:00Z",
    "isActive": true
  }
}
```

#### DELETE /devices/{deviceId}
Revoke device access.

**Response:**
```json
{
  "success": true,
  "message": "Device access revoked successfully"
}
```

### Sync Endpoints

#### GET /sync/operations
Get sync operations since timestamp.

**Query Parameters:**
- `since`: Timestamp vector for last sync
- `limit` (optional): Maximum operations (default: 100)

**Response:**
```json
{
  "success": true,
  "operations": [
    {
      "id": "operation-uuid",
      "operationType": "create",
      "resourceType": "totp_seed",
      "resourceId": "seed-uuid",
      "timestampVector": 1704628800000,
      "deviceId": "source-device-id",
      "deviceName": "iPhone 15 Pro",
      "createdAt": "2025-01-07T10:00:00Z"
    }
  ],
  "latestTimestamp": 1704628800000
}
```

#### POST /sync/operations
Record sync operation.

**Request:**
```json
{
  "operationType": "update",
  "resourceType": "totp_seed",
  "resourceId": "seed-uuid",
  "timestampVector": 1704628800001
}
```

**Response:**
```json
{
  "success": true,
  "operation": {
    "id": "operation-uuid",
    "operationType": "update",
    "resourceType": "totp_seed",
    "resourceId": "seed-uuid",
    "timestampVector": 1704628800001,
    "deviceId": "current-device-id",
    "createdAt": "2025-01-07T10:01:00Z"
  }
}
```

### Backup & Recovery Endpoints

#### POST /backup/create
Create encrypted backup recovery code.

**Request:**
```json
{
  "encryptedBlob": "base64-encrypted-backup-blob",
  "salt": "base64-pbkdf2-salt",
  "hint": "My secure passphrase hint"
}
```

**Response:**
```json
{
  "success": true,
  "recoveryCode": {
    "id": "recovery-uuid",
    "hint": "My secure passphrase hint",
    "createdAt": "2025-01-07T10:00:00Z"
  }
}
```

#### POST /backup/recover
Recover account using backup code.

**Request:**
```json
{
  "username": "user@example.com",
  "encryptedBlob": "base64-encrypted-backup-blob",
  "passphrase": "user-recovery-passphrase"
}
```

**Response:**
```json
{
  "success": true,
  "recoveredData": {
    "wrappedDEK": "base64-wrapped-dek",
    "salt": "base64-original-salt",
    "keyVersion": 1
  }
}
```

### User Management Endpoints

#### GET /user/profile
Get user profile information.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "username": "user@example.com",
    "displayName": "John Doe",
    "createdAt": "2025-01-07T09:00:00Z",
    "lastLoginAt": "2025-01-07T10:00:00Z"
  },
  "stats": {
    "totalSeeds": 15,
    "activeDevices": 3,
    "lastSyncAt": "2025-01-07T10:30:00Z"
  }
}
```

#### PUT /user/profile
Update user profile.

**Request:**
```json
{
  "displayName": "John Smith",
  "username": "john.smith@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "username": "john.smith@example.com",
    "displayName": "John Smith",
    "createdAt": "2025-01-07T09:00:00Z",
    "updatedAt": "2025-01-07T10:30:00Z"
  }
}
```

#### DELETE /user/account
Delete user account (with confirmation).

**Request:**
```json
{
  "confirmDeletion": "DELETE_MY_ACCOUNT",
  "reason": "No longer needed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

## Error Handling

### Standard Error Format
All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "WEBAUTHN_CHALLENGE_EXPIRED",
    "message": "WebAuthn challenge has expired. Please try again.",
    "details": {
      "challengeId": "challenge-uuid",
      "expiredAt": "2025-01-07T10:05:00Z"
    }
  },
  "requestId": "req-uuid-for-debugging"
}
```

### Error Codes

#### Authentication Errors (4xx)
- `UNAUTHORIZED`: Missing or invalid authentication
- `WEBAUTHN_CHALLENGE_EXPIRED`: Challenge token expired
- `WEBAUTHN_VERIFICATION_FAILED`: Credential verification failed
- `PRF_NOT_SUPPORTED`: WebAuthn PRF extension not available
- `DEVICE_NOT_REGISTERED`: Device not registered for sync

#### Client Errors (4xx)
- `INVALID_REQUEST`: Malformed request body
- `VALIDATION_ERROR`: Request validation failed
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `DUPLICATE_RESOURCE`: Resource already exists
- `RATE_LIMIT_EXCEEDED`: Too many requests

#### Server Errors (5xx)
- `INTERNAL_ERROR`: Unexpected server error
- `DATABASE_ERROR`: Database operation failed
- `ENCRYPTION_ERROR`: Cryptographic operation failed
- `SYNC_CONFLICT`: Unable to resolve sync conflict

## Rate Limiting

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704628800
```

### Rate Limits by Endpoint Category

| Category | Limit | Window |
|----------|-------|--------|
| Authentication | 10 requests | 1 minute |
| Vault Operations | 100 requests | 1 minute |
| Sync Operations | 50 requests | 1 minute |
| Search | 20 requests | 1 minute |
| User Management | 10 requests | 1 minute |

## Security Headers

### Response Headers
```http
Content-Security-Policy: default-src 'self'; script-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

## Pagination

### Cursor-Based Pagination
For large datasets, use cursor-based pagination:

**Request:**
```http
GET /vault/seeds?limit=50&cursor=eyJpZCI6InNlZWQtdXVpZCJ9
```

**Response:**
```json
{
  "success": true,
  "seeds": [...],
  "pagination": {
    "hasMore": true,
    "nextCursor": "eyJpZCI6Im5leHQtc2VlZC11dWlkIn0",
    "prevCursor": "eyJpZCI6InByZXYtc2VlZC11dWlkIn0"
  }
}
```

## API Versioning

### Version Strategy
- **URL Versioning**: `/v1/`, `/v2/` etc.
- **Backward Compatibility**: Previous versions supported for 12 months
- **Deprecation Notice**: 90-day advance notice via headers
- **Migration Guide**: Comprehensive migration documentation

### Version Headers
```http
API-Version: 1.0
API-Deprecation-Notice: Version 1.0 will be deprecated on 2025-12-31
API-Sunset: 2026-01-31
```

This API design provides a secure, scalable foundation for the E2E encrypted TOTP vault while maintaining excellent developer experience and security standards. 