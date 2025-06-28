package interfaces

import (
	"context"

	"github.com/bug-breeder/2fair/server/internal/domain/entities"
	"github.com/google/uuid"
)

// EncryptionKeyRepository defines the interface for user encryption key data access
type EncryptionKeyRepository interface {
	// Create creates a new user encryption key
	Create(ctx context.Context, key *entities.UserEncryptionKey) error

	// GetActiveByUserID retrieves the active encryption key for a user
	GetActiveByUserID(ctx context.Context, userID uuid.UUID) (*entities.UserEncryptionKey, error)

	// GetByUserIDAndVersion retrieves an encryption key by user ID and version
	GetByUserIDAndVersion(ctx context.Context, userID uuid.UUID, version int) (*entities.UserEncryptionKey, error)

	// GetAllByUserID retrieves all encryption keys for a user
	GetAllByUserID(ctx context.Context, userID uuid.UUID) ([]*entities.UserEncryptionKey, error)

	// Update updates an existing encryption key
	Update(ctx context.Context, key *entities.UserEncryptionKey) error

	// DeactivateOldKeys deactivates all keys with version less than the specified version
	DeactivateOldKeys(ctx context.Context, userID uuid.UUID, currentVersion int) error

	// RotateKey creates a new key version and deactivates old ones in a transaction
	RotateKey(ctx context.Context, newKey *entities.UserEncryptionKey) error

	// GetLatestVersion gets the latest key version for a user
	GetLatestVersion(ctx context.Context, userID uuid.UUID) (int, error)
}
