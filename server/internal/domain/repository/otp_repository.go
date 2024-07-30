package repository

import (
	"context"

	"github.com/bug-breeder/2fair/server/internal/domain/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type OTPRepository interface {
	AddOTP(ctx context.Context, userID primitive.ObjectID, otp *models.OTP) error
	InactivateOTP(ctx context.Context, userID, otpID primitive.ObjectID) error
	EditOTP(ctx context.Context, userID, otpID primitive.ObjectID, otp *models.OTP) error
	ListOTPs(ctx context.Context, userID primitive.ObjectID) ([]models.OTP, error)
}
