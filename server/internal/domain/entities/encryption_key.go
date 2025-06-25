package entities

import (
	"time"

	"github.com/google/uuid"
)

// UserEncryptionKey represents a wrapped Data Encryption Key (DEK) for a user
type UserEncryptionKey struct {
	ID         uuid.UUID `json:"id" db:"id"`
	UserID     uuid.UUID `json:"userId" db:"user_id"`
	KeyVersion int       `json:"keyVersion" db:"key_version"`
	WrappedDEK []byte    `json:"wrappedDEK" db:"wrapped_dek"` // DEK encrypted with KEK from WebAuthn PRF
	Salt       []byte    `json:"salt" db:"salt"`              // Salt used in HKDF for KEK->DEK derivation
	CreatedAt  time.Time `json:"createdAt" db:"created_at"`
	IsActive   bool      `json:"isActive" db:"is_active"`
}

// NewUserEncryptionKey creates a new user encryption key
func NewUserEncryptionKey(userID uuid.UUID, keyVersion int, wrappedDEK, salt []byte) *UserEncryptionKey {
	return &UserEncryptionKey{
		ID:         uuid.New(),
		UserID:     userID,
		KeyVersion: keyVersion,
		WrappedDEK: wrappedDEK,
		Salt:       salt,
		CreatedAt:  time.Now(),
		IsActive:   true,
	}
}

// Validate validates the encryption key entity
func (k *UserEncryptionKey) Validate() error {
	if k.UserID == uuid.Nil {
		return ErrInvalidEncryptionKey
	}
	if k.KeyVersion < 1 {
		return ErrInvalidEncryptionKey
	}
	if len(k.WrappedDEK) == 0 {
		return ErrInvalidEncryptionKey
	}
	if len(k.Salt) == 0 {
		return ErrInvalidEncryptionKey
	}
	return nil
}

// Deactivate marks the encryption key as inactive
func (k *UserEncryptionKey) Deactivate() {
	k.IsActive = false
}

// Activate marks the encryption key as active
func (k *UserEncryptionKey) Activate() {
	k.IsActive = true
}
