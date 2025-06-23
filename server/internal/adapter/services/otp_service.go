package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/bug-breeder/2fair/server/internal/domain/entities"
	"github.com/bug-breeder/2fair/server/internal/domain/repositories"
	"github.com/bug-breeder/2fair/server/internal/domain/services"
	infraServices "github.com/bug-breeder/2fair/server/internal/infrastructure/services"
	"github.com/google/uuid"
)

// OTPSecretData represents the encrypted portion of OTP data
type OTPSecretData struct {
	Secret    string `json:"secret"`
	Period    int    `json:"period"`
	Algorithm string `json:"algorithm"`
	Digits    int    `json:"digits"`
}

// otpService implements the domain OTP service interface
type otpService struct {
	otpRepo       repositories.OTPRepository
	cryptoService infraServices.CryptoService
	totpService   infraServices.TOTPService
}

// NewOTPService creates a new OTP service
func NewOTPService(otpRepo repositories.OTPRepository, cryptoService infraServices.CryptoService, totpService infraServices.TOTPService) services.OTPService {
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
	otp := entities.NewOTP(userID, issuer, label, secret, period)
	otp.Algorithm = algorithm
	otp.Digits = digits

	// Validate the OTP
	if err := otp.Validate(); err != nil {
		return nil, fmt.Errorf("invalid OTP data: %w", err)
	}

	// Prepare secret data for encryption
	secretData := &OTPSecretData{
		Secret:    secret,
		Period:    period,
		Algorithm: algorithm,
		Digits:    digits,
	}

	// Encrypt the secret data
	encryptedData, err := s.encryptSecretData(secretData)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt secret data: %w", err)
	}

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

	// Validate the updated OTP
	if err := existingOTP.Validate(); err != nil {
		return nil, fmt.Errorf("invalid updated OTP data: %w", err)
	}

	// Prepare secret data for encryption
	secretData := &OTPSecretData{
		Secret:    secret,
		Period:    period,
		Algorithm: algorithm,
		Digits:    digits,
	}

	// Encrypt the secret data
	encryptedData, err := s.encryptSecretData(secretData)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt secret data: %w", err)
	}

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

// encryptSecretData encrypts the secret data
func (s *otpService) encryptSecretData(secretData *OTPSecretData) ([]byte, error) {
	// Marshal secret data to JSON
	jsonData, err := json.Marshal(secretData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal secret data: %w", err)
	}

	// For now, we'll use a fixed key for encryption
	// In a real implementation, this should be derived from user's master key
	// TODO: Implement proper key derivation from user's master password/key
	key, err := s.cryptoService.GenerateRandomKey()
	if err != nil {
		return nil, fmt.Errorf("failed to generate encryption key: %w", err)
	}

	// Encrypt the data
	ciphertext, nonce, err := s.cryptoService.Encrypt(jsonData, key)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt data: %w", err)
	}

	// For now, we'll just return the ciphertext
	// In a real implementation, we need to store the key securely
	// and include nonce in the encrypted data structure
	_ = nonce // TODO: Handle nonce properly

	return ciphertext, nil
}
