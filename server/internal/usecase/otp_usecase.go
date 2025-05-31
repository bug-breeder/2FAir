package usecase

import (
	"context"
	"fmt"
	"log/slog"
	"strconv"
	"time"

	"github.com/bug-breeder/2fair/server/internal/adapter/repository"
	"github.com/bug-breeder/2fair/server/internal/domain/dto"
	"github.com/bug-breeder/2fair/server/internal/domain/models"
	"github.com/pquerna/otp/totp"
)

type OTPUseCase struct {
	otpRepo repository.OTPRepository
	logger  *slog.Logger
}

func NewOTPUseCase(otpRepo repository.OTPRepository) *OTPUseCase {
	return &OTPUseCase{
		otpRepo: otpRepo,
		logger:  slog.Default().With("component", "OTPUseCase"),
	}
}

func (uc *OTPUseCase) AddOTP(ctx context.Context, userID string, otp *models.OTP) error {
	uc.logger.Info("AddOTP use case called",
		"userID", userID,
		"issuer", otp.Issuer,
		"label", otp.Label)

	userIDInt, err := strconv.Atoi(userID)
	if err != nil {
		uc.logger.Error("Failed to convert userID to int",
			"userID", userID,
			"error", err)
		return err
	}

	// Set defaults before validation
	otp.SetDefaults()

	// Validate and normalize OTP parameters
	if err := otp.ValidateAndNormalize(); err != nil {
		uc.logger.Warn("OTP validation failed",
			"userID", userIDInt,
			"issuer", otp.Issuer,
			"error", err)
		return fmt.Errorf("validation failed: %w", err)
	}

	uc.logger.Info("OTP validation successful",
		"userID", userIDInt,
		"issuer", otp.Issuer,
		"normalizedSecret", otp.Secret[:8]+"...")

	// The ID, CreatedAt and Active fields will be assigned by the database
	// In SQL we don't need to pre-assign ID as it's auto-incremented
	err = uc.otpRepo.AddOTP(ctx, userIDInt, otp)
	if err != nil {
		uc.logger.Error("Failed to add OTP",
			"userID", userIDInt,
			"issuer", otp.Issuer,
			"error", err)
		return err
	}

	uc.logger.Info("OTP added successfully",
		"userID", userIDInt,
		"issuer", otp.Issuer,
		"label", otp.Label)
	return nil
}

func (uc *OTPUseCase) InactivateOTP(ctx context.Context, userID, otpID string) error {
	userIDInt, err := strconv.Atoi(userID)
	if err != nil {
		uc.logger.Error("Failed to convert userID to int",
			"userID", userID,
			"error", err)
		return err
	}

	otpIDInt, err := strconv.Atoi(otpID)
	if err != nil {
		uc.logger.Error("Failed to convert otpID to int",
			"otpID", otpID,
			"error", err)
		return err
	}

	err = uc.otpRepo.InactivateOTP(ctx, userIDInt, otpIDInt)
	if err != nil {
		uc.logger.Error("Failed to inactivate OTP",
			"userID", userIDInt,
			"otpID", otpIDInt,
			"error", err)
		return err
	}

	uc.logger.Info("OTP inactivated successfully",
		"userID", userIDInt,
		"otpID", otpIDInt)
	return nil
}

func (uc *OTPUseCase) EditOTP(ctx context.Context, userID, otpID string, otp *models.OTP) error {
	uc.logger.Info("EditOTP use case called",
		"userID", userID,
		"otpID", otpID,
		"otp.Issuer", otp.Issuer,
		"otp.Label", otp.Label,
		"otp.Secret", otp.Secret,
		"otp.Algorithm", otp.Algorithm,
		"otp.Digits", otp.Digits,
		"otp.Period", otp.Period)

	userIDInt, err := strconv.Atoi(userID)
	if err != nil {
		uc.logger.Error("Failed to convert userID to int",
			"userID", userID,
			"error", err)
		return err
	}

	otpIDInt, err := strconv.Atoi(otpID)
	if err != nil {
		uc.logger.Error("Failed to convert otpID to int",
			"otpID", otpID,
			"error", err)
		return err
	}

	// Set defaults before validation
	otp.SetDefaults()

	// Validate and normalize OTP parameters
	if err := otp.ValidateAndNormalize(); err != nil {
		uc.logger.Warn("OTP validation failed during edit",
			"userID", userIDInt,
			"otpID", otpIDInt,
			"issuer", otp.Issuer,
			"error", err)
		return fmt.Errorf("validation failed: %w", err)
	}

	uc.logger.Info("EditOTP calling repository",
		"userIDInt", userIDInt,
		"otpIDInt", otpIDInt,
		"otp.Issuer", otp.Issuer,
		"otp.Label", otp.Label,
		"normalizedSecret", otp.Secret[:8]+"...")

	err = uc.otpRepo.EditOTP(ctx, userIDInt, otpIDInt, otp)
	if err != nil {
		uc.logger.Error("Failed to edit OTP",
			"userID", userIDInt,
			"otpID", otpIDInt,
			"error", err)
		return err
	}

	uc.logger.Info("OTP edited successfully",
		"userID", userIDInt,
		"otpID", otpIDInt,
		"issuer", otp.Issuer)
	return nil
}

func (uc *OTPUseCase) ListOTPs(ctx context.Context, userID string) ([]models.OTP, error) {
	userIDInt, err := strconv.Atoi(userID)
	if err != nil {
		uc.logger.Error("Failed to convert userID to int",
			"userID", userID,
			"error", err)
		return nil, err
	}

	otps, err := uc.otpRepo.ListOTPs(ctx, userIDInt)
	if err != nil {
		uc.logger.Error("Failed to list OTPs",
			"userID", userIDInt,
			"error", err)
		return nil, err
	}

	uc.logger.Debug("Listed OTPs successfully",
		"userID", userIDInt,
		"count", len(otps))
	return otps, nil
}

func (uc *OTPUseCase) GenerateOTPCodes(ctx context.Context, userID string) ([]dto.GenerateOTPCodesResponse, error) {
	uc.logger.Debug("Starting OTP code generation", "userID", userID)

	userIDInt, err := strconv.Atoi(userID)
	if err != nil {
		uc.logger.Error("Failed to convert userID to int",
			"userID", userID,
			"error", err)
		return nil, err
	}

	uc.logger.Debug("Converted userID to int",
		"userID", userID,
		"userIDInt", userIDInt)

	otps, err := uc.otpRepo.ListOTPs(ctx, userIDInt)
	if err != nil {
		uc.logger.Error("Failed to list OTPs for code generation",
			"userID", userIDInt,
			"error", err)
		return nil, err
	}

	uc.logger.Debug("Found OTPs for code generation",
		"userID", userIDInt,
		"otpCount", len(otps))

	codes := make([]dto.GenerateOTPCodesResponse, len(otps))

	for i, otp := range otps {
		uc.logger.Debug("Processing OTP for code generation",
			"index", i,
			"otpID", otp.ID,
			"issuer", otp.Issuer,
			"period", otp.Period)

		now := time.Now()
		periodDuration := time.Duration(otp.Period) * time.Second

		currentExpireAt := now.Truncate(periodDuration).Add(periodDuration)

		currentCode, err := totp.GenerateCode(otp.Secret, now)
		if err != nil {
			uc.logger.Error("Failed to generate current TOTP code",
				"otpID", otp.ID,
				"issuer", otp.Issuer,
				"error", err)
			return nil, err
		}

		nextExpireAt := currentExpireAt.Add(periodDuration)
		nextTime := now.Add(periodDuration)
		nextCode, err := totp.GenerateCode(otp.Secret, nextTime)
		if err != nil {
			uc.logger.Error("Failed to generate next TOTP code",
				"otpID", otp.ID,
				"issuer", otp.Issuer,
				"error", err)
			return nil, err
		}

		codes[i] = dto.GenerateOTPCodesResponse{
			ID:              otp.ID,
			CurrentCode:     currentCode,
			NextCode:        nextCode,
			CurrentExpireAt: currentExpireAt,
			NextExpireAt:    nextExpireAt,
		}

		uc.logger.Debug("Generated TOTP codes successfully",
			"otpID", otp.ID,
			"issuer", otp.Issuer,
			"currentCode", currentCode,
			"nextCode", nextCode)
	}

	uc.logger.Info("Generated OTP codes successfully",
		"userID", userIDInt,
		"codeCount", len(codes))
	return codes, nil
}
