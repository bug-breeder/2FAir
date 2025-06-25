package repositories

import (
	"context"

	"github.com/bug-breeder/2fair/server/internal/domain/entities"
	"github.com/google/uuid"
)

// OTPRepository defines the interface for encrypted OTP data access
type OTPRepository interface {
	// Create creates a new encrypted OTP entry
	Create(ctx context.Context, otp *entities.OTP, encryptedData []byte, keyVersion int) error

	// GetByID retrieves a decrypted OTP by ID
	GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*entities.OTP, error)

	// GetByUserID retrieves all decrypted OTPs for a user
	GetByUserID(ctx context.Context, userID uuid.UUID) ([]*entities.OTP, error)

	// Update updates an existing encrypted OTP entry
	Update(ctx context.Context, otp *entities.OTP, encryptedData []byte, keyVersion int) error

	// Delete soft deletes an OTP entry (marks as inactive)
	Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error

	// GetEncryptedData retrieves the raw encrypted data for an OTP
	GetEncryptedData(ctx context.Context, id uuid.UUID, userID uuid.UUID) ([]byte, int, error)
}
