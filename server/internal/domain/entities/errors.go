package entities

import "errors"

// User validation errors
var (
	ErrInvalidUsername    = errors.New("invalid username")
	ErrInvalidEmail       = errors.New("invalid email")
	ErrInvalidDisplayName = errors.New("invalid display name")
	ErrUserNotFound       = errors.New("user not found")
	ErrUserAlreadyExists  = errors.New("user already exists")
)

// WebAuthn credential errors
var (
	ErrInvalidCredential    = errors.New("invalid webauthn credential")
	ErrCredentialNotFound   = errors.New("credential not found")
	ErrCredentialExists     = errors.New("credential already exists")
	ErrPRFNotSupported      = errors.New("PRF extension not supported")
	ErrAuthenticationFailed = errors.New("authentication failed")
)

// Encryption key errors
var (
	ErrInvalidEncryptionKey = errors.New("invalid encryption key")
	ErrKeyNotFound          = errors.New("encryption key not found")
	ErrKeyExpired           = errors.New("encryption key expired")
)

// TOTP seed errors
var (
	ErrInvalidTOTPSeed  = errors.New("invalid TOTP seed")
	ErrTOTPSeedNotFound = errors.New("TOTP seed not found")
	ErrEncryptionFailed = errors.New("encryption failed")
	ErrDecryptionFailed = errors.New("decryption failed")
)

// Device session errors
var (
	ErrInvalidDevice   = errors.New("invalid device")
	ErrDeviceNotFound  = errors.New("device not found")
	ErrDeviceExpired   = errors.New("device session expired")
	ErrDeviceNotActive = errors.New("device not active")
)

// Sync operation errors
var (
	ErrSyncConflict     = errors.New("sync conflict")
	ErrInvalidOperation = errors.New("invalid sync operation")
	ErrSyncFailed       = errors.New("synchronization failed")
)

// Backup and recovery errors
var (
	ErrInvalidBackup     = errors.New("invalid backup")
	ErrBackupNotFound    = errors.New("backup not found")
	ErrRecoveryFailed    = errors.New("recovery failed")
	ErrInvalidPassphrase = errors.New("invalid passphrase")
)
