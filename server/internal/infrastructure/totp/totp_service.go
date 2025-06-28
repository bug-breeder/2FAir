package totp

import (
	"crypto/hmac"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/base32"
	"encoding/binary"
	"fmt"
	"github.com/bug-breeder/2fair/server/internal/domain/interfaces"
	"hash"
	"strings"
	"time"
)

type totpService struct{}

// NewTOTPService creates a new TOTP service
func NewTOTPService() interfaces.TOTPService {
	return &totpService{}
}

// GenerateCodesForTime generates current and next TOTP codes for a specific time
func (t *totpService) GenerateCodesForTime(secret string, algorithm string, digits int, period int, timestamp time.Time) (string, string, time.Time, time.Time, error) {
	// Calculate current time window
	timeWindow := timestamp.Unix() / int64(period)
	currentExpiry := time.Unix((timeWindow+1)*int64(period), 0)
	nextExpiry := time.Unix((timeWindow+2)*int64(period), 0)

	// Generate current code
	currentCode, err := t.generateTOTPCode(secret, algorithm, digits, timeWindow)
	if err != nil {
		return "", "", time.Time{}, time.Time{}, fmt.Errorf("failed to generate current code: %w", err)
	}

	// Generate next code
	nextCode, err := t.generateTOTPCode(secret, algorithm, digits, timeWindow+1)
	if err != nil {
		return "", "", time.Time{}, time.Time{}, fmt.Errorf("failed to generate next code: %w", err)
	}

	return currentCode, nextCode, currentExpiry, nextExpiry, nil
}

// GenerateCode generates a single TOTP code for a specific time
func (t *totpService) GenerateCode(secret string, algorithm string, digits int, period int, timestamp time.Time) (string, error) {
	timeWindow := timestamp.Unix() / int64(period)
	return t.generateTOTPCode(secret, algorithm, digits, timeWindow)
}

// ValidateCode validates a TOTP code against the expected value with time tolerance
func (t *totpService) ValidateCode(secret string, algorithm string, digits int, period int, code string, tolerance int) (bool, error) {
	now := time.Now()
	currentWindow := now.Unix() / int64(period)

	// Check within tolerance window
	for i := -tolerance; i <= tolerance; i++ {
		window := currentWindow + int64(i)
		expectedCode, err := t.generateTOTPCode(secret, algorithm, digits, window)
		if err != nil {
			return false, fmt.Errorf("failed to generate code for validation: %w", err)
		}
		if expectedCode == code {
			return true, nil
		}
	}

	return false, nil
}

// generateTOTPCode generates a TOTP code for a specific time window
func (t *totpService) generateTOTPCode(secret string, algorithm string, digits int, timeWindow int64) (string, error) {
	// Normalize secret
	secret = strings.ToUpper(strings.ReplaceAll(secret, " ", ""))

	// Decode base32 secret
	secretBytes, err := base32.StdEncoding.DecodeString(secret)
	if err != nil {
		return "", fmt.Errorf("failed to decode secret: %w", err)
	}

	// Convert time window to byte array
	timeBytes := make([]byte, 8)
	binary.BigEndian.PutUint64(timeBytes, uint64(timeWindow))

	// Create HMAC hash
	var hasher hash.Hash
	switch algorithm {
	case "SHA1":
		hasher = hmac.New(sha1.New, secretBytes)
	case "SHA256":
		hasher = hmac.New(sha256.New, secretBytes)
	case "SHA512":
		hasher = hmac.New(sha512.New, secretBytes)
	default:
		return "", fmt.Errorf("unsupported algorithm: %s", algorithm)
	}

	hasher.Write(timeBytes)
	hash := hasher.Sum(nil)

	// Dynamic truncation
	offset := hash[len(hash)-1] & 0xf
	truncatedHash := binary.BigEndian.Uint32(hash[offset:offset+4]) & 0x7fffffff

	// Generate code with specified digits
	code := truncatedHash % uint32(pow10(digits))

	// Format with leading zeros
	format := fmt.Sprintf("%%0%dd", digits)
	return fmt.Sprintf(format, code), nil
}

// ParseOTPAuthURL parses an otpauth:// URL and extracts TOTP configuration
func (t *totpService) ParseOTPAuthURL(urlStr string) (*interfaces.TOTPConfig, error) {
	// This is a simplified implementation
	// In a real implementation, you would properly parse the URL
	// For now, return an error since this feature is marked as TODO in the handler
	return nil, fmt.Errorf("OTP auth URL parsing not implemented")
}

// GenerateOTPAuthURL generates an otpauth:// URL from TOTP configuration
func (t *totpService) GenerateOTPAuthURL(config *interfaces.TOTPConfig) string {
	// Set defaults
	algorithm := config.Algorithm
	if algorithm == "" {
		algorithm = "SHA1"
	}
	digits := config.Digits
	if digits == 0 {
		digits = 6
	}
	period := config.Period
	if period == 0 {
		period = 30
	}

	return fmt.Sprintf("otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=%s&digits=%d&period=%d",
		config.Issuer, config.AccountName, config.Secret, config.Issuer, algorithm, digits, period)
}

// pow10 calculates 10^n
func pow10(n int) int {
	result := 1
	for i := 0; i < n; i++ {
		result *= 10
	}
	return result
}
