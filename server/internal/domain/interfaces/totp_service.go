package interfaces

import "time"

// TOTPConfig represents TOTP configuration parameters
type TOTPConfig struct {
	Secret      string `json:"secret"`
	Issuer      string `json:"issuer"`
	AccountName string `json:"accountName"`
	Algorithm   string `json:"algorithm"`
	Digits      int    `json:"digits"`
	Period      int    `json:"period"`
}

// TOTPService handles TOTP code generation
type TOTPService interface {
	// GenerateCodesForTime generates current and next TOTP codes for a specific time
	GenerateCodesForTime(secret string, algorithm string, digits int, period int, timestamp time.Time) (string, string, time.Time, time.Time, error)

	// GenerateCode generates a single TOTP code for a specific time
	GenerateCode(secret string, algorithm string, digits int, period int, timestamp time.Time) (string, error)

	// ValidateCode validates a TOTP code against the expected value with time tolerance
	ValidateCode(secret string, algorithm string, digits int, period int, code string, tolerance int) (bool, error)

	// ParseOTPAuthURL parses an otpauth:// URL and extracts TOTP configuration
	ParseOTPAuthURL(url string) (*TOTPConfig, error)

	// GenerateOTPAuthURL generates an otpauth:// URL from TOTP configuration
	GenerateOTPAuthURL(config *TOTPConfig) string
}
