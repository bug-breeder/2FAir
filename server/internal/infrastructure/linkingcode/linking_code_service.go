package linkingcode

import (
	"context"

	"github.com/bug-breeder/2fair/server/internal/domain/entities"
	"github.com/google/uuid"
)

// LinkingCodeService handles linking code operations for device linking
type LinkingCodeService interface {
	// GenerateCode creates a new linking code for a user
	GenerateCode(ctx context.Context, userID uuid.UUID) (*entities.LinkingCode, error)

	// ValidateCode validates a linking code and returns the associated user
	ValidateCode(ctx context.Context, code string) (*entities.LinkingCode, error)

	// UseCode marks a linking code as used and returns the user
	UseCode(ctx context.Context, code string) (*entities.LinkingCode, error)

	// GetUserCodes retrieves all active linking codes for a user
	GetUserCodes(ctx context.Context, userID uuid.UUID) ([]*entities.LinkingCode, error)

	// RevokeCode revokes a specific linking code
	RevokeCode(ctx context.Context, codeID uuid.UUID) error

	// RevokeUserCodes revokes all linking codes for a user
	RevokeUserCodes(ctx context.Context, userID uuid.UUID) error

	// CleanupExpiredCodes removes all expired linking codes from the system
	CleanupExpiredCodes(ctx context.Context) error
}

// LinkingCodeRequest represents a request to create a linking code
type LinkingCodeRequest struct {
	UserID uuid.UUID `json:"userId" validate:"required"`
}

// LinkingCodeResponse represents a linking code response
type LinkingCodeResponse struct {
	ID        uuid.UUID `json:"id"`
	Code      string    `json:"code"`
	ExpiresAt string    `json:"expiresAt"`
	IsUsed    bool      `json:"isUsed"`
	CreatedAt string    `json:"createdAt"`
}

// ValidateLinkingCodeRequest represents a request to validate a linking code
type ValidateLinkingCodeRequest struct {
	Code string `json:"code" validate:"required,len=12"`
}

// LinkingCodeValidationResponse represents the response from validating a linking code
type LinkingCodeValidationResponse struct {
	Valid   bool      `json:"valid"`
	UserID  uuid.UUID `json:"userId,omitempty"`
	Code    string    `json:"code,omitempty"`
	CodeID  uuid.UUID `json:"codeId,omitempty"`
	Message string    `json:"message,omitempty"`
}
