package repositories

import (
	"context"

	"github.com/bug-breeder/2fair/server/internal/domain/entities"
	"github.com/google/uuid"
)

// WebAuthnCredentialRepository defines the interface for WebAuthn credential data access
type WebAuthnCredentialRepository interface {
	// Create creates a new WebAuthn credential
	Create(ctx context.Context, credential *entities.WebAuthnCredential) error

	// GetByID retrieves a credential by ID
	GetByID(ctx context.Context, id uuid.UUID) (*entities.WebAuthnCredential, error)

	// GetByCredentialID retrieves a credential by credential ID
	GetByCredentialID(ctx context.Context, credentialID []byte) (*entities.WebAuthnCredential, error)

	// GetByUserID retrieves all credentials for a user
	GetByUserID(ctx context.Context, userID uuid.UUID) ([]*entities.WebAuthnCredential, error)

	// Update updates an existing credential
	Update(ctx context.Context, credential *entities.WebAuthnCredential) error

	// UpdateSignCount updates the sign count and last used timestamp
	UpdateSignCount(ctx context.Context, credentialID []byte, signCount uint64) error

	// UpdateCloneWarning updates the clone warning flag
	UpdateCloneWarning(ctx context.Context, credentialID []byte, cloneWarning bool) error

	// Delete deletes a credential
	Delete(ctx context.Context, credentialID []byte, userID uuid.UUID) error

	// ExistsByCredentialID checks if a credential exists by credential ID
	ExistsByCredentialID(ctx context.Context, credentialID []byte) (bool, error)
}
