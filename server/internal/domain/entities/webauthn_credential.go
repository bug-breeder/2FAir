package entities

import (
	"time"

	"github.com/google/uuid"
)

// WebAuthnCredential represents a WebAuthn credential for a user
type WebAuthnCredential struct {
	ID             uuid.UUID  `json:"id" db:"id"`
	UserID         uuid.UUID  `json:"userId" db:"user_id"`
	CredentialID   []byte     `json:"credentialId" db:"credential_id"`
	PublicKey      []byte     `json:"publicKey" db:"public_key"`
	AAGUID         *uuid.UUID `json:"aaguid,omitempty" db:"aaguid"`
	CloneWarning   bool       `json:"cloneWarning" db:"clone_warning"`
	Attachment     string     `json:"attachment,omitempty" db:"attachment"` // platform, cross-platform
	Transport      []string   `json:"transport,omitempty" db:"transport"`   // usb, nfc, ble, internal
	BackupEligible bool       `json:"backupEligible" db:"backup_eligible"`
	BackupState    bool       `json:"backupState" db:"backup_state"`
	SignCount      uint64     `json:"signCount" db:"sign_count"`
	CreatedAt      time.Time  `json:"createdAt" db:"created_at"`
	LastUsedAt     *time.Time `json:"lastUsedAt,omitempty" db:"last_used_at"`
}

// NewWebAuthnCredential creates a new WebAuthn credential
func NewWebAuthnCredential(userID uuid.UUID, credentialID, publicKey []byte) *WebAuthnCredential {
	return &WebAuthnCredential{
		ID:           uuid.New(),
		UserID:       userID,
		CredentialID: credentialID,
		PublicKey:    publicKey,
		CreatedAt:    time.Now(),
		SignCount:    0,
	}
}

// Validate validates the WebAuthn credential
func (w *WebAuthnCredential) Validate() error {
	if w.UserID == uuid.Nil {
		return ErrInvalidCredential
	}
	if len(w.CredentialID) == 0 {
		return ErrInvalidCredential
	}
	if len(w.PublicKey) == 0 {
		return ErrInvalidCredential
	}
	return nil
}

// UpdateSignCount updates the sign count and last used timestamp
func (w *WebAuthnCredential) UpdateSignCount(newCount uint64) {
	// Check for clone warning (sign count decreased)
	if newCount < w.SignCount {
		w.CloneWarning = true
	}

	w.SignCount = newCount
	now := time.Now()
	w.LastUsedAt = &now
}

// UpdateUsage updates the last used timestamp
func (w *WebAuthnCredential) UpdateUsage() {
	now := time.Now()
	w.LastUsedAt = &now
}

// SetTransport sets the transport methods for the credential
func (w *WebAuthnCredential) SetTransport(transport []string) {
	w.Transport = transport
}

// SetAttachment sets the attachment type for the credential
func (w *WebAuthnCredential) SetAttachment(attachment string) {
	w.Attachment = attachment
}

// SetBackupFlags sets the backup eligible and state flags
func (w *WebAuthnCredential) SetBackupFlags(eligible, state bool) {
	w.BackupEligible = eligible
	w.BackupState = state
}
