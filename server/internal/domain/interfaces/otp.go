package interfaces

import (
	"context"

	"github.com/bug-breeder/2fair/server/internal/domain/entities"
	"github.com/google/uuid"
)

// OTPService handles encrypted TOTP operations
type OTPService interface {
	// CreateOTP creates a new encrypted OTP entry
	CreateOTP(ctx context.Context, userID uuid.UUID, issuer, label, secret string, period int, algorithm string, digits int) (*entities.OTP, error)

	// GetOTP retrieves a decrypted OTP by ID
	GetOTP(ctx context.Context, otpID uuid.UUID, userID uuid.UUID) (*entities.OTP, error)

	// ListOTPs retrieves all decrypted OTPs for a user
	ListOTPs(ctx context.Context, userID uuid.UUID) ([]*entities.OTP, error)

	// UpdateOTP updates an existing encrypted OTP entry
	UpdateOTP(ctx context.Context, otpID uuid.UUID, userID uuid.UUID, issuer, label, secret string, period int, algorithm string, digits int) (*entities.OTP, error)

	// DeleteOTP soft deletes an OTP entry
	DeleteOTP(ctx context.Context, otpID uuid.UUID, userID uuid.UUID) error

	// GenerateOTPCodes generates current and next TOTP codes for all user's OTPs
	GenerateOTPCodes(ctx context.Context, userID uuid.UUID) ([]*entities.OTPCodes, error)
}
