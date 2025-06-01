package models

import (
	"encoding/base32"
	"fmt"
	"regexp"
	"strings"
	"time"
)

type OTP struct {
	ID        int       `json:"id" db:"id"`
	UserID    int       `json:"user_id" db:"user_id"`
	Issuer    string    `json:"issuer" db:"issuer"`
	Label     string    `json:"label" db:"label"`
	Secret    string    `json:"secret" db:"secret"`
	Algorithm string    `json:"algorithm" db:"algorithm"`
	Digits    int       `json:"digits" db:"digits"`
	Period    int       `json:"period" db:"period"`
	Counter   int       `json:"counter" db:"counter"`
	Method    string    `json:"method" db:"method"`
	Active    bool      `json:"active" db:"active"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// ValidateAndNormalize validates and normalizes OTP parameters
func (o *OTP) ValidateAndNormalize() error {
	// Validate and normalize secret
	if err := o.validateAndNormalizeSecret(); err != nil {
		return fmt.Errorf("invalid secret: %w", err)
	}

	// Validate issuer
	if err := o.validateIssuer(); err != nil {
		return fmt.Errorf("invalid issuer: %w", err)
	}

	// Validate label
	if err := o.validateLabel(); err != nil {
		return fmt.Errorf("invalid label: %w", err)
	}

	// Validate algorithm
	if err := o.validateAlgorithm(); err != nil {
		return fmt.Errorf("invalid algorithm: %w", err)
	}

	// Validate digits
	if err := o.validateDigits(); err != nil {
		return fmt.Errorf("invalid digits: %w", err)
	}

	// Validate period
	if err := o.validatePeriod(); err != nil {
		return fmt.Errorf("invalid period: %w", err)
	}

	// Validate method
	if err := o.validateMethod(); err != nil {
		return fmt.Errorf("invalid method: %w", err)
	}

	return nil
}

// ValidateForEdit validates OTP parameters for edit operations
// Only validates non-empty fields, allowing partial updates
func (o *OTP) ValidateForEdit() error {
	// Only validate secret if it's being updated (not empty)
	if o.Secret != "" {
		if err := o.validateAndNormalizeSecret(); err != nil {
			return fmt.Errorf("invalid secret: %w", err)
		}
	}

	// Only validate issuer if it's being updated (not empty)
	if o.Issuer != "" {
		if err := o.validateIssuer(); err != nil {
			return fmt.Errorf("invalid issuer: %w", err)
		}
	}

	// Only validate label if it's being updated (not empty)
	if o.Label != "" {
		if err := o.validateLabel(); err != nil {
			return fmt.Errorf("invalid label: %w", err)
		}
	}

	// Only validate algorithm if it's being updated (not empty)
	if o.Algorithm != "" {
		if err := o.validateAlgorithm(); err != nil {
			return fmt.Errorf("invalid algorithm: %w", err)
		}
	}

	// Only validate digits if it's being updated (not zero)
	if o.Digits != 0 {
		if err := o.validateDigits(); err != nil {
			return fmt.Errorf("invalid digits: %w", err)
		}
	}

	// Only validate period if it's being updated (not zero)
	if o.Period != 0 {
		if err := o.validatePeriod(); err != nil {
			return fmt.Errorf("invalid period: %w", err)
		}
	}

	// Only validate method if it's being updated (not empty)
	if o.Method != "" {
		if err := o.validateMethod(); err != nil {
			return fmt.Errorf("invalid method: %w", err)
		}
	}

	return nil
}

// validateAndNormalizeSecret validates and normalizes the TOTP secret
func (o *OTP) validateAndNormalizeSecret() error {
	if o.Secret == "" {
		return fmt.Errorf("secret cannot be empty")
	}

	// Remove spaces and convert to uppercase
	normalized := strings.ToUpper(strings.ReplaceAll(o.Secret, " ", ""))

	// Remove common separators that users might include
	normalized = strings.ReplaceAll(normalized, "-", "")
	normalized = strings.ReplaceAll(normalized, "_", "")

	// Validate base32 format
	if !isValidBase32(normalized) {
		return fmt.Errorf("secret must be valid base32 encoded string (A-Z, 2-7)")
	}

	// Try to decode to ensure it's valid
	_, err := base32.StdEncoding.DecodeString(normalized)
	if err != nil {
		return fmt.Errorf("secret is not valid base32: %w", err)
	}

	// Check minimum length (should be at least 80 bits / 16 base32 chars for security)
	if len(normalized) < 16 {
		return fmt.Errorf("secret too short, minimum 16 characters required for security")
	}

	// Check maximum length (reasonable upper bound)
	if len(normalized) > 128 {
		return fmt.Errorf("secret too long, maximum 128 characters allowed")
	}

	o.Secret = normalized
	return nil
}

// validateIssuer validates the issuer field
func (o *OTP) validateIssuer() error {
	if o.Issuer == "" {
		return fmt.Errorf("issuer cannot be empty")
	}

	if len(o.Issuer) > 100 {
		return fmt.Errorf("issuer too long, maximum 100 characters allowed")
	}

	// Check for invalid characters
	if strings.ContainsAny(o.Issuer, ":;") {
		return fmt.Errorf("issuer cannot contain ':' or ';' characters")
	}

	// Trim whitespace
	o.Issuer = strings.TrimSpace(o.Issuer)
	return nil
}

// validateLabel validates the label field
func (o *OTP) validateLabel() error {
	if o.Label == "" {
		return fmt.Errorf("label cannot be empty")
	}

	if len(o.Label) > 100 {
		return fmt.Errorf("label too long, maximum 100 characters allowed")
	}

	// Check for invalid characters
	if strings.ContainsAny(o.Label, ":;") {
		return fmt.Errorf("label cannot contain ':' or ';' characters")
	}

	// Trim whitespace
	o.Label = strings.TrimSpace(o.Label)
	return nil
}

// validateAlgorithm validates the algorithm field
func (o *OTP) validateAlgorithm() error {
	validAlgorithms := map[string]bool{
		"SHA1":   true,
		"SHA256": true,
		"SHA512": true,
	}

	algorithm := strings.ToUpper(o.Algorithm)
	if !validAlgorithms[algorithm] {
		return fmt.Errorf("algorithm must be one of: SHA1, SHA256, SHA512")
	}

	o.Algorithm = algorithm
	return nil
}

// validateDigits validates the digits field
func (o *OTP) validateDigits() error {
	if o.Digits < 6 || o.Digits > 8 {
		return fmt.Errorf("digits must be between 6 and 8")
	}
	return nil
}

// validatePeriod validates the period field for TOTP
func (o *OTP) validatePeriod() error {
	if o.Method == "TOTP" {
		if o.Period < 15 || o.Period > 300 {
			return fmt.Errorf("period must be between 15 and 300 seconds")
		}
	}
	return nil
}

// validateMethod validates the method field
func (o *OTP) validateMethod() error {
	validMethods := map[string]bool{
		"TOTP": true,
		"HOTP": true,
	}

	method := strings.ToUpper(o.Method)
	if !validMethods[method] {
		return fmt.Errorf("method must be either TOTP or HOTP")
	}

	o.Method = method
	return nil
}

// isValidBase32 checks if a string contains only valid base32 characters
func isValidBase32(s string) bool {
	// Base32 alphabet: A-Z (26 letters) + 2-7 (6 digits) = 32 characters
	base32Regex := regexp.MustCompile(`^[A-Z2-7]+$`)
	return base32Regex.MatchString(s)
}

// SetDefaults sets default values for optional fields
func (o *OTP) SetDefaults() {
	if o.Algorithm == "" {
		o.Algorithm = "SHA1"
	}
	if o.Digits == 0 {
		o.Digits = 6
	}
	if o.Period == 0 && o.Method == "TOTP" {
		o.Period = 30
	}
	if o.Method == "" {
		o.Method = "TOTP"
	}
	if o.Counter == 0 && o.Method == "HOTP" {
		o.Counter = 0
	}
}

// SetDefaultsForEdit sets default values for optional fields during edit
// Only sets defaults for fields that are zero/empty
func (o *OTP) SetDefaultsForEdit() {
	// Don't override existing values, only set if empty/zero
	if o.Algorithm == "" {
		o.Algorithm = "SHA1"
	}
	if o.Digits == 0 {
		o.Digits = 6
	}
	if o.Period == 0 && (o.Method == "TOTP" || o.Method == "") {
		o.Period = 30
	}
	if o.Method == "" {
		o.Method = "TOTP"
	}
}
