package interfaces

import (
	"context"

	"github.com/bug-breeder/2fair/server/internal/domain/entities"
	"github.com/google/uuid"
)

// LinkingCodeRepository defines the interface for linking code data access
type LinkingCodeRepository interface {
	// Create creates a new linking code
	Create(ctx context.Context, linkingCode *entities.LinkingCode) error

	// GetByCode retrieves a linking code by its code
	GetByCode(ctx context.Context, code string) (*entities.LinkingCode, error)

	// GetByUserID retrieves all linking codes for a user
	GetByUserID(ctx context.Context, userID uuid.UUID) ([]*entities.LinkingCode, error)

	// Update updates an existing linking code
	Update(ctx context.Context, linkingCode *entities.LinkingCode) error

	// Delete deletes a linking code
	Delete(ctx context.Context, id uuid.UUID) error

	// CleanupExpired removes all expired linking codes
	CleanupExpired(ctx context.Context) error

	// GetActiveByUserID retrieves all active (valid) linking codes for a user
	GetActiveByUserID(ctx context.Context, userID uuid.UUID) ([]*entities.LinkingCode, error)
}
