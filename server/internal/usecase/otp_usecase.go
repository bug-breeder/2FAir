package usecase

import (
	"context"
	"time"

	"github.com/bug-breeder/2fair/server/internal/domain/dto"
	"github.com/bug-breeder/2fair/server/internal/domain/models"
	"github.com/bug-breeder/2fair/server/internal/domain/repository"
	"github.com/pquerna/otp/totp"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type OTPUseCase struct {
	otpRepo repository.OTPRepository
}

func NewOTPUseCase(otpRepo repository.OTPRepository) *OTPUseCase {
	return &OTPUseCase{otpRepo: otpRepo}
}

func (uc *OTPUseCase) AddOTP(ctx context.Context, userID string, otp *models.OTP) error {
	userObjectID, _ := primitive.ObjectIDFromHex(userID)
	otp.ID = primitive.NewObjectID()
	otp.CreatedAt = time.Now()
	otp.Active = true

	return uc.otpRepo.AddOTP(ctx, userObjectID, otp)
}

func (uc *OTPUseCase) InactivateOTP(ctx context.Context, userID, otpID string) error {
	userObjectID, _ := primitive.ObjectIDFromHex(userID)
	otpObjectID, _ := primitive.ObjectIDFromHex(otpID)
	return uc.otpRepo.InactivateOTP(ctx, userObjectID, otpObjectID)
}

func (uc *OTPUseCase) EditOTP(ctx context.Context, userID, otpID string, otp *models.OTP) error {
	userObjectID, _ := primitive.ObjectIDFromHex(userID)
	otpObjectID, _ := primitive.ObjectIDFromHex(otpID)
	return uc.otpRepo.EditOTP(ctx, userObjectID, otpObjectID, otp)
}

func (uc *OTPUseCase) ListOTPs(ctx context.Context, userID string) ([]models.OTP, error) {
	userObjectID, _ := primitive.ObjectIDFromHex(userID)
	return uc.otpRepo.ListOTPs(ctx, userObjectID)
}

func (uc *OTPUseCase) GenerateOTPCodes(ctx context.Context, userID string) ([]dto.GenerateOTPCodesResponse, error) {
	userObjectID, _ := primitive.ObjectIDFromHex(userID)
	otps, err := uc.otpRepo.ListOTPs(ctx, userObjectID)
	if err != nil {
		return nil, err
	}

	codes := make([]dto.GenerateOTPCodesResponse, len(otps))

	for i, otp := range otps {
		now := time.Now()
		periodDuration := time.Duration(otp.Period) * time.Second

		currentExpireAt := now.Truncate(periodDuration).Add(periodDuration)

		currentCode, err := totp.GenerateCode(otp.Secret, now)
		if err != nil {
			return nil, err
		}

		nextExpireAt := currentExpireAt.Add(periodDuration)
		nextTime := now.Add(periodDuration)
		nextCode, err := totp.GenerateCode(otp.Secret, nextTime)
		if err != nil {
			return nil, err
		}

		codes[i] = dto.GenerateOTPCodesResponse{
			ID:              otp.ID,
			CurrentCode:     currentCode,
			NextCode:        nextCode,
			CurrentExpireAt: currentExpireAt,
			NextExpireAt:    nextExpireAt,
		}
	}

	return codes, nil
}
