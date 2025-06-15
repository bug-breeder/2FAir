package entities

import (
	"time"

	"github.com/google/uuid"
)

// DeviceSession represents a user session on a specific device
type DeviceSession struct {
	ID             uuid.UUID `json:"id" db:"id"`
	UserID         uuid.UUID `json:"user_id" db:"user_id"`
	SessionToken   string    `json:"session_token" db:"session_token"`
	DeviceInfo     string    `json:"device_info" db:"device_info"`
	IPAddress      string    `json:"ip_address" db:"ip_address"`
	UserAgent      string    `json:"user_agent" db:"user_agent"`
	IsActive       bool      `json:"is_active" db:"is_active"`
	LastActivityAt time.Time `json:"last_activity_at" db:"last_activity_at"`
	ExpiresAt      time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

// IsExpired checks if the session has expired
func (ds *DeviceSession) IsExpired() bool {
	return time.Now().After(ds.ExpiresAt)
}

// IsValid checks if the session is valid (active and not expired)
func (ds *DeviceSession) IsValid() bool {
	return ds.IsActive && !ds.IsExpired()
}

// Validate performs basic validation on the device session
func (ds *DeviceSession) Validate() error {
	if ds.UserID == uuid.Nil {
		return ErrInvalidDevice
	}

	if ds.SessionToken == "" {
		return ErrInvalidDevice
	}

	if ds.DeviceInfo == "" {
		return ErrInvalidDevice
	}

	if ds.ExpiresAt.Before(time.Now()) {
		return ErrDeviceExpired
	}

	return nil
}

// UpdateActivity updates the last activity timestamp
func (ds *DeviceSession) UpdateActivity() {
	ds.LastActivityAt = time.Now()
	ds.UpdatedAt = time.Now()
}

// Deactivate marks the session as inactive
func (ds *DeviceSession) Deactivate() {
	ds.IsActive = false
	ds.UpdatedAt = time.Now()
}
