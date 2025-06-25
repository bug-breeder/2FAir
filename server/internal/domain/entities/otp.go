package entities

import (
	"time"

	"github.com/google/uuid"
)

// OTP represents a TOTP token entry in the vault
type OTP struct {
	ID        uuid.UUID `json:"Id" db:"id"` // Frontend expects "Id"
	UserID    uuid.UUID `json:"userId" db:"user_id"`
	Issuer    string    `json:"Issuer" db:"issuer"`         // Frontend expects "Issuer"
	Label     string    `json:"Label" db:"account_name"`    // Frontend expects "Label"
	Secret    string    `json:"Secret" db:"-"`              // Frontend expects "Secret", never stored in DB
	Period    int       `json:"Period" db:"-"`              // Frontend expects "Period", stored in encrypted data
	Algorithm string    `json:"algorithm,omitempty" db:"-"` // Stored in encrypted data
	Digits    int       `json:"digits,omitempty" db:"-"`    // Stored in encrypted data
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
	IsActive  bool      `json:"isActive" db:"-"` // Computed from encrypted_totp_seeds table
}

// OTPCodes represents the current and next TOTP codes
type OTPCodes struct {
	ID              string `json:"Id"`
	CurrentCode     string `json:"CurrentCode"`
	CurrentExpireAt string `json:"CurrentExpireAt"` // Frontend expects string format
	NextCode        string `json:"NextCode"`
	NextExpireAt    string `json:"NextExpireAt"` // Frontend expects string format
}

// NewOTP creates a new OTP entry
func NewOTP(userID uuid.UUID, issuer, label, secret string, period int) *OTP {
	return &OTP{
		ID:        uuid.New(),
		UserID:    userID,
		Issuer:    issuer,
		Label:     label,
		Secret:    secret,
		Period:    period,
		Algorithm: "SHA1", // Default algorithm
		Digits:    6,      // Default digits
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		IsActive:  true,
	}
}

// Validate validates the OTP entry
func (o *OTP) Validate() error {
	if o.UserID == uuid.Nil {
		return ErrInvalidTOTPSeed
	}
	if o.Issuer == "" {
		return ErrInvalidTOTPSeed
	}
	if o.Label == "" {
		return ErrInvalidTOTPSeed
	}
	if o.Secret == "" {
		return ErrInvalidTOTPSeed
	}
	if o.Period <= 0 {
		return ErrInvalidTOTPSeed
	}
	return nil
}

// UpdateSecret updates the secret and related fields
func (o *OTP) UpdateSecret(secret string, period int, algorithm string, digits int) {
	o.Secret = secret
	o.Period = period
	if algorithm != "" {
		o.Algorithm = algorithm
	}
	if digits > 0 {
		o.Digits = digits
	}
	o.UpdatedAt = time.Now()
}

// UpdateMetadata updates the issuer and label
func (o *OTP) UpdateMetadata(issuer, label string) {
	o.Issuer = issuer
	o.Label = label
	o.UpdatedAt = time.Now()
}
