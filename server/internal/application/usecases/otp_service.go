package application

import (
	"context"
	"fmt"
	"time"

	"github.com/bug-breeder/2fair/server/internal/domain/entities"
	"github.com/bug-breeder/2fair/server/internal/domain/interfaces"
	"github.com/google/uuid"
)

// otpService implements the domain OTP service interface
type otpService struct {
	otpRepo       interfaces.OTPRepository
	cryptoService interfaces.CryptoService
	totpService   interfaces.TOTPService
}

// NewOTPService creates a new OTP service
func NewOTPService(otpRepo interfaces.OTPRepository, cryptoService interfaces.CryptoService, totpService interfaces.TOTPService) interfaces.OTPService {
	return &otpService{
		otpRepo:       otpRepo,
		cryptoService: cryptoService,
		totpService:   totpService,
	}
}

// CreateOTP creates a new encrypted OTP entry
func (s *otpService) CreateOTP(ctx context.Context, userID uuid.UUID, issuer, label, secret string, period int, algorithm string, digits int) (*entities.OTP, error) {
	// Set defaults if not provided
	if algorithm == "" {
		algorithm = "SHA1"
	}
	if digits == 0 {
		digits = 6
	}
	if period == 0 {
		period = 30
	}

	// Create OTP entity
	// Note: secret is already encrypted client-side in format "ciphertext.iv.authTag"
	otp := entities.NewOTP(userID, issuer, label, secret, period)
	otp.Algorithm = algorithm
	otp.Digits = digits

	// Skip validation of encrypted secret (it won't be valid base32)
	// Only validate issuer and label which should not be empty
	if otp.Issuer == "" || otp.Label == "" {
		return nil, fmt.Errorf("issuer and label are required")
	}

	// Store the already-encrypted secret directly (no double encryption)
	// The secret comes pre-encrypted from the client in format: ciphertext.iv.authTag
	encryptedData := []byte(secret)

	// Save to repository
	if err := s.otpRepo.Create(ctx, otp, encryptedData, 1); err != nil {
		return nil, fmt.Errorf("failed to create OTP: %w", err)
	}

	// Return the OTP (without sensitive data persisted)
	return otp, nil
}

// GetOTP retrieves a decrypted OTP by ID
func (s *otpService) GetOTP(ctx context.Context, otpID uuid.UUID, userID uuid.UUID) (*entities.OTP, error) {
	// Get OTP from repository (this should already decrypt it)
	otp, err := s.otpRepo.GetByID(ctx, otpID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get OTP: %w", err)
	}

	return otp, nil
}

// ListOTPs retrieves all decrypted OTPs for a user
func (s *otpService) ListOTPs(ctx context.Context, userID uuid.UUID) ([]*entities.OTP, error) {
	// Get OTPs from repository (these should already be decrypted)
	otps, err := s.otpRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get OTPs: %w", err)
	}

	return otps, nil
}

// UpdateOTP updates an existing encrypted OTP entry
func (s *otpService) UpdateOTP(ctx context.Context, otpID uuid.UUID, userID uuid.UUID, issuer, label, secret string, period int, algorithm string, digits int) (*entities.OTP, error) {
	// Set defaults if not provided
	if algorithm == "" {
		algorithm = "SHA1"
	}
	if digits == 0 {
		digits = 6
	}
	if period == 0 {
		period = 30
	}

	// First, get the existing OTP to verify ownership
	existingOTP, err := s.otpRepo.GetByID(ctx, otpID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get existing OTP: %w", err)
	}

	// Update the OTP entity
	existingOTP.UpdateMetadata(issuer, label)
	existingOTP.UpdateSecret(secret, period, algorithm, digits)

	// Only validate issuer and label which should not be empty
	if issuer == "" || label == "" {
		return nil, fmt.Errorf("issuer and label are required")
	}

	// Store the already-encrypted secret directly (no double encryption)
	// The secret comes pre-encrypted from the client in format: ciphertext.iv.authTag
	encryptedData := []byte(secret)

	// Update in repository
	if err := s.otpRepo.Update(ctx, existingOTP, encryptedData, 1); err != nil {
		return nil, fmt.Errorf("failed to update OTP: %w", err)
	}

	return existingOTP, nil
}

// DeleteOTP soft deletes an OTP entry
func (s *otpService) DeleteOTP(ctx context.Context, otpID uuid.UUID, userID uuid.UUID) error {
	// Delete from repository
	if err := s.otpRepo.Delete(ctx, otpID, userID); err != nil {
		return fmt.Errorf("failed to delete OTP: %w", err)
	}

	return nil
}

// GenerateOTPCodes generates current and next TOTP codes for all user's OTPs
func (s *otpService) GenerateOTPCodes(ctx context.Context, userID uuid.UUID) ([]*entities.OTPCodes, error) {
	// Get all user's OTPs
	otps, err := s.ListOTPs(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user OTPs: %w", err)
	}

	var otpCodes []*entities.OTPCodes
	for _, otp := range otps {
		// Generate current and next codes
		current, next, currentExpiry, nextExpiry, err := s.totpService.GenerateCodesForTime(
			otp.Secret, otp.Algorithm, otp.Digits, otp.Period, time.Now(),
		)
		if err != nil {
			// Log error but continue with other OTPs
			continue
		}

		codes := &entities.OTPCodes{
			ID:              otp.ID.String(),
			CurrentCode:     current,
			CurrentExpireAt: currentExpiry.Format("2006-01-02T15:04:05Z07:00"),
			NextCode:        next,
			NextExpireAt:    nextExpiry.Format("2006-01-02T15:04:05Z07:00"),
		}

		otpCodes = append(otpCodes, codes)
	}

	return otpCodes, nil
}
