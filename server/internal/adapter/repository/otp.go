package repository

import (
	"context"

	"github.com/bug-breeder/2fair/server/internal/domain/models"
)

type OTPRepository interface {
	AddOTP(ctx context.Context, userID int, otp *models.OTP) error
	InactivateOTP(ctx context.Context, userID, otpID int) error
	EditOTP(ctx context.Context, userID, otpID int, otp *models.OTP) error
	ListOTPs(ctx context.Context, userID int) ([]models.OTP, error)
}
