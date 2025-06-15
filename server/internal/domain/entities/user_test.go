package entities

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewUser(t *testing.T) {
	username := "testuser"
	email := "test@example.com"
	displayName := "Test User"

	user := NewUser(username, email, displayName)

	assert.NotEqual(t, uuid.Nil, user.ID)
	assert.Equal(t, username, user.Username)
	assert.Equal(t, email, user.Email)
	assert.Equal(t, displayName, user.DisplayName)
	assert.True(t, user.IsActive)
	assert.False(t, user.CreatedAt.IsZero())
	assert.False(t, user.UpdatedAt.IsZero())
	assert.Nil(t, user.LastLoginAt)
}

func TestUser_Validate_Success(t *testing.T) {
	tests := []struct {
		name     string
		username string
		email    string
		display  string
	}{
		{
			name:     "valid user with all fields",
			username: "testuser",
			email:    "test@example.com",
			display:  "Test User",
		},
		{
			name:     "valid user with minimum username",
			username: "abc", // 3 characters minimum
			email:    "test@example.com",
			display:  "Test User",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			user := NewUser(tt.username, tt.email, tt.display)
			err := user.Validate()
			assert.NoError(t, err)
		})
	}
}

func TestUser_Validate_Errors(t *testing.T) {
	tests := []struct {
		name        string
		username    string
		email       string
		display     string
		expectedErr error
	}{
		{
			name:        "empty username",
			username:    "",
			email:       "test@example.com",
			display:     "Test User",
			expectedErr: ErrInvalidUsername,
		},
		{
			name:        "empty email",
			username:    "testuser",
			email:       "",
			display:     "Test User",
			expectedErr: ErrInvalidEmail,
		},
		{
			name:        "empty display name",
			username:    "testuser",
			email:       "test@example.com",
			display:     "",
			expectedErr: ErrInvalidDisplayName,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			user := NewUser(tt.username, tt.email, tt.display)
			err := user.Validate()
			assert.Error(t, err)
			assert.Equal(t, tt.expectedErr, err)
		})
	}
}

func TestUser_UpdateLastLogin(t *testing.T) {
	user := NewUser("testuser", "test@example.com", "Test User")
	originalUpdatedAt := user.UpdatedAt

	// Initially no last login
	assert.Nil(t, user.LastLoginAt)

	// Wait a bit to ensure time difference
	time.Sleep(1 * time.Millisecond)

	// Update last login
	beforeUpdate := time.Now()
	user.UpdateLastLogin()
	afterUpdate := time.Now()

	require.NotNil(t, user.LastLoginAt)
	assert.True(t, user.LastLoginAt.After(beforeUpdate) || user.LastLoginAt.Equal(beforeUpdate))
	assert.True(t, user.LastLoginAt.Before(afterUpdate) || user.LastLoginAt.Equal(afterUpdate))
	assert.True(t, user.UpdatedAt.After(originalUpdatedAt))

	// Update again
	firstLogin := *user.LastLoginAt
	time.Sleep(1 * time.Millisecond) // Ensure time difference
	user.UpdateLastLogin()

	require.NotNil(t, user.LastLoginAt)
	assert.True(t, user.LastLoginAt.After(firstLogin))
}

func TestUser_Deactivate(t *testing.T) {
	user := NewUser("testuser", "test@example.com", "Test User")
	originalUpdatedAt := user.UpdatedAt

	// Initially active
	assert.True(t, user.IsActive)

	// Wait a bit to ensure time difference
	time.Sleep(1 * time.Millisecond)

	// Deactivate
	user.Deactivate()

	assert.False(t, user.IsActive)
	assert.True(t, user.UpdatedAt.After(originalUpdatedAt))
}

func TestUser_FieldAssignment(t *testing.T) {
	user := NewUser("testuser", "test@example.com", "Test User")

	// Test direct field modification (since no Update methods exist)
	newUsername := "newusername"
	newEmail := "new@example.com"
	newDisplayName := "New Display Name"

	user.Username = newUsername
	user.Email = newEmail
	user.DisplayName = newDisplayName
	user.UpdatedAt = time.Now()

	assert.Equal(t, newUsername, user.Username)
	assert.Equal(t, newEmail, user.Email)
	assert.Equal(t, newDisplayName, user.DisplayName)

	// Validate after manual update
	err := user.Validate()
	assert.NoError(t, err)
}

func TestUser_FieldValidation_AfterManualUpdate(t *testing.T) {
	user := NewUser("testuser", "test@example.com", "Test User")

	// Manually set invalid data
	user.Username = ""
	user.Email = ""
	user.DisplayName = ""

	// Should fail validation
	err := user.Validate()
	assert.Error(t, err)
	// Will return the first error encountered (username)
	assert.Equal(t, ErrInvalidUsername, err)
}
