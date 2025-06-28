package interfaces

import (
	"context"
	"time"

	"github.com/bug-breeder/2fair/server/internal/domain/entities"
	"github.com/google/uuid"
)

// TOTPSeedRepository defines the interface for encrypted TOTP seed data access
type TOTPSeedRepository interface {
	// Create creates a new encrypted TOTP seed
	Create(ctx context.Context, seed *entities.EncryptedTOTPSeed) error

	// GetByID retrieves an encrypted TOTP seed by ID
	GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*entities.EncryptedTOTPSeed, error)

	// GetAllByUserID retrieves all encrypted TOTP seeds for a user
	GetAllByUserID(ctx context.Context, userID uuid.UUID) ([]*entities.EncryptedTOTPSeed, error)

	// GetByUserIDSince retrieves TOTP seeds modified since a timestamp (for sync)
	GetByUserIDSince(ctx context.Context, userID uuid.UUID, since time.Time) ([]*entities.EncryptedTOTPSeed, error)

	// Update updates an existing encrypted TOTP seed
	Update(ctx context.Context, seed *entities.EncryptedTOTPSeed) error

	// Delete deletes an encrypted TOTP seed
	Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error

	// Search searches TOTP seeds by metadata (issuer, account name, tags)
	Search(ctx context.Context, userID uuid.UUID, query string) ([]*entities.EncryptedTOTPSeed, error)

	// UpdateSyncTimestamp updates the sync timestamp for a TOTP seed
	UpdateSyncTimestamp(ctx context.Context, id uuid.UUID, userID uuid.UUID) error

	// GetCount gets the total number of TOTP seeds for a user
	GetCount(ctx context.Context, userID uuid.UUID) (int64, error)

	// GetByKeyVersion retrieves all TOTP seeds encrypted with a specific key version
	GetByKeyVersion(ctx context.Context, userID uuid.UUID, keyVersion int) ([]*entities.EncryptedTOTPSeed, error)

	// UpdateKeyVersion updates the key version for TOTP seeds (for key rotation)
	UpdateKeyVersion(ctx context.Context, userID uuid.UUID, oldVersion, newVersion int) error
}
