package usecase

import (
	"context"
	"strconv"
	"time"

	"github.com/bug-breeder/2fair/server/internal/adapter/repository"
	"github.com/bug-breeder/2fair/server/internal/domain/dto"
	"github.com/bug-breeder/2fair/server/internal/domain/models"
	"github.com/pquerna/otp/totp"
)

type OTPUseCase struct {
	otpRepo repository.OTPRepository
}

func NewOTPUseCase(otpRepo repository.OTPRepository) *OTPUseCase {
	return &OTPUseCase{otpRepo: otpRepo}
}

func (uc *OTPUseCase) AddOTP(ctx context.Context, userID string, otp *models.OTP) error {
	userIDInt, err := strconv.Atoi(userID)
	if err != nil {
		return err
	}

	// The ID, CreatedAt and Active fields will be assigned by the database
	// In SQL we don't need to pre-assign ID as it's auto-incremented
	return uc.otpRepo.AddOTP(ctx, userIDInt, otp)
}

func (uc *OTPUseCase) InactivateOTP(ctx context.Context, userID, otpID string) error {
	userIDInt, err := strconv.Atoi(userID)
	if err != nil {
		return err
	}

	otpIDInt, err := strconv.Atoi(otpID)
	if err != nil {
		return err
	}

	return uc.otpRepo.InactivateOTP(ctx, userIDInt, otpIDInt)
}

func (uc *OTPUseCase) EditOTP(ctx context.Context, userID, otpID string, otp *models.OTP) error {
	userIDInt, err := strconv.Atoi(userID)
	if err != nil {
		return err
	}

	otpIDInt, err := strconv.Atoi(otpID)
	if err != nil {
		return err
	}

	return uc.otpRepo.EditOTP(ctx, userIDInt, otpIDInt, otp)
}

func (uc *OTPUseCase) ListOTPs(ctx context.Context, userID string) ([]models.OTP, error) {
	userIDInt, err := strconv.Atoi(userID)
	if err != nil {
		return nil, err
	}

	return uc.otpRepo.ListOTPs(ctx, userIDInt)
}

func (uc *OTPUseCase) GenerateOTPCodes(ctx context.Context, userID string) ([]dto.GenerateOTPCodesResponse, error) {
	userIDInt, err := strconv.Atoi(userID)
	if err != nil {
		return nil, err
	}

	otps, err := uc.otpRepo.ListOTPs(ctx, userIDInt)
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
