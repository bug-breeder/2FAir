package entities

import (
	"time"

	"github.com/google/uuid"
)

// User represents a user in the system
type User struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	Username    string     `json:"username" db:"username" validate:"required,min=3,max=255"`
	Email       string     `json:"email" db:"email" validate:"required,email,max=255"`
	DisplayName string     `json:"displayName" db:"display_name" validate:"required,min=1,max=255"`
	CreatedAt   time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt   time.Time  `json:"updatedAt" db:"updated_at"`
	LastLoginAt *time.Time `json:"lastLoginAt,omitempty" db:"last_login_at"`
	IsActive    bool       `json:"isActive" db:"is_active"`
}

// NewUser creates a new user with default values
func NewUser(username, email, displayName string) *User {
	return &User{
		ID:          uuid.New(),
		Username:    username,
		Email:       email,
		DisplayName: displayName,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		IsActive:    true,
	}
}

// Validate validates the user entity
func (u *User) Validate() error {
	// Basic validation - in production, use a proper validation library
	if u.Username == "" {
		return ErrInvalidUsername
	}
	if u.Email == "" {
		return ErrInvalidEmail
	}
	if u.DisplayName == "" {
		return ErrInvalidDisplayName
	}
	return nil
}

// UpdateLastLogin updates the last login timestamp
func (u *User) UpdateLastLogin() {
	now := time.Now()
	u.LastLoginAt = &now
	u.UpdatedAt = now
}

// Deactivate deactivates the user account
func (u *User) Deactivate() {
	u.IsActive = false
	u.UpdatedAt = time.Now()
}
