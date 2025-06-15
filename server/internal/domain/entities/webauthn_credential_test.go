package entities

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewWebAuthnCredential(t *testing.T) {
	userID := uuid.New()
	credentialID := []byte("test-credential-id")
	publicKey := []byte("test-public-key")

	cred := NewWebAuthnCredential(userID, credentialID, publicKey)

	assert.NotEqual(t, uuid.Nil, cred.ID)
	assert.Equal(t, userID, cred.UserID)
	assert.Equal(t, credentialID, cred.CredentialID)
	assert.Equal(t, publicKey, cred.PublicKey)
	assert.False(t, cred.CreatedAt.IsZero())
	assert.Equal(t, uint64(0), cred.SignCount)
	assert.False(t, cred.CloneWarning)
	assert.Nil(t, cred.LastUsedAt)
}

func TestWebAuthnCredential_Validate_Success(t *testing.T) {
	userID := uuid.New()
	credentialID := []byte("test-credential-id")
	publicKey := []byte("test-public-key")

	cred := NewWebAuthnCredential(userID, credentialID, publicKey)
	err := cred.Validate()
	assert.NoError(t, err)
}

func TestWebAuthnCredential_Validate_Errors(t *testing.T) {
	tests := []struct {
		name         string
		userID       uuid.UUID
		credentialID []byte
		publicKey    []byte
		expectedErr  error
	}{
		{
			name:         "nil user ID",
			userID:       uuid.Nil,
			credentialID: []byte("test-credential-id"),
			publicKey:    []byte("test-public-key"),
			expectedErr:  ErrInvalidCredential,
		},
		{
			name:         "empty credential ID",
			userID:       uuid.New(),
			credentialID: []byte{},
			publicKey:    []byte("test-public-key"),
			expectedErr:  ErrInvalidCredential,
		},
		{
			name:         "nil credential ID",
			userID:       uuid.New(),
			credentialID: nil,
			publicKey:    []byte("test-public-key"),
			expectedErr:  ErrInvalidCredential,
		},
		{
			name:         "empty public key",
			userID:       uuid.New(),
			credentialID: []byte("test-credential-id"),
			publicKey:    []byte{},
			expectedErr:  ErrInvalidCredential,
		},
		{
			name:         "nil public key",
			userID:       uuid.New(),
			credentialID: []byte("test-credential-id"),
			publicKey:    nil,
			expectedErr:  ErrInvalidCredential,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cred := NewWebAuthnCredential(tt.userID, tt.credentialID, tt.publicKey)
			err := cred.Validate()
			assert.Error(t, err)
			assert.Equal(t, tt.expectedErr, err)
		})
	}
}

func TestWebAuthnCredential_UpdateSignCount(t *testing.T) {
	userID := uuid.New()
	credentialID := []byte("test-credential-id")
	publicKey := []byte("test-public-key")

	cred := NewWebAuthnCredential(userID, credentialID, publicKey)

	// Initially sign count is 0 and no last used
	assert.Equal(t, uint64(0), cred.SignCount)
	assert.Nil(t, cred.LastUsedAt)
	assert.False(t, cred.CloneWarning)

	// Update sign count to a higher value
	beforeUpdate := time.Now()
	cred.UpdateSignCount(5)
	afterUpdate := time.Now()

	assert.Equal(t, uint64(5), cred.SignCount)
	require.NotNil(t, cred.LastUsedAt)
	assert.True(t, cred.LastUsedAt.After(beforeUpdate) || cred.LastUsedAt.Equal(beforeUpdate))
	assert.True(t, cred.LastUsedAt.Before(afterUpdate) || cred.LastUsedAt.Equal(afterUpdate))
	assert.False(t, cred.CloneWarning)

	// Update to higher value again
	firstUsed := *cred.LastUsedAt
	time.Sleep(1 * time.Millisecond)
	cred.UpdateSignCount(10)

	assert.Equal(t, uint64(10), cred.SignCount)
	assert.True(t, cred.LastUsedAt.After(firstUsed))
	assert.False(t, cred.CloneWarning)

	// Update to lower value (clone warning)
	cred.UpdateSignCount(5)
	assert.Equal(t, uint64(5), cred.SignCount)
	assert.True(t, cred.CloneWarning)
}

func TestWebAuthnCredential_UpdateUsage(t *testing.T) {
	userID := uuid.New()
	credentialID := []byte("test-credential-id")
	publicKey := []byte("test-public-key")

	cred := NewWebAuthnCredential(userID, credentialID, publicKey)

	// Initially no last used
	assert.Nil(t, cred.LastUsedAt)

	// Update usage
	beforeUpdate := time.Now()
	cred.UpdateUsage()
	afterUpdate := time.Now()

	require.NotNil(t, cred.LastUsedAt)
	assert.True(t, cred.LastUsedAt.After(beforeUpdate) || cred.LastUsedAt.Equal(beforeUpdate))
	assert.True(t, cred.LastUsedAt.Before(afterUpdate) || cred.LastUsedAt.Equal(afterUpdate))
}

func TestWebAuthnCredential_SetTransport(t *testing.T) {
	userID := uuid.New()
	credentialID := []byte("test-credential-id")
	publicKey := []byte("test-public-key")

	cred := NewWebAuthnCredential(userID, credentialID, publicKey)

	// Initially no transport
	assert.Nil(t, cred.Transport)

	// Set transport methods
	transport := []string{"usb", "nfc", "ble"}
	cred.SetTransport(transport)

	assert.Equal(t, transport, cred.Transport)
	assert.Len(t, cred.Transport, 3)
	assert.Contains(t, cred.Transport, "usb")
	assert.Contains(t, cred.Transport, "nfc")
	assert.Contains(t, cred.Transport, "ble")
}

func TestWebAuthnCredential_SetAttachment(t *testing.T) {
	userID := uuid.New()
	credentialID := []byte("test-credential-id")
	publicKey := []byte("test-public-key")

	cred := NewWebAuthnCredential(userID, credentialID, publicKey)

	// Initially no attachment
	assert.Equal(t, "", cred.Attachment)

	// Set platform attachment
	cred.SetAttachment("platform")
	assert.Equal(t, "platform", cred.Attachment)

	// Set cross-platform attachment
	cred.SetAttachment("cross-platform")
	assert.Equal(t, "cross-platform", cred.Attachment)
}

func TestWebAuthnCredential_SetBackupFlags(t *testing.T) {
	userID := uuid.New()
	credentialID := []byte("test-credential-id")
	publicKey := []byte("test-public-key")

	cred := NewWebAuthnCredential(userID, credentialID, publicKey)

	// Initially backup flags are false
	assert.False(t, cred.BackupEligible)
	assert.False(t, cred.BackupState)

	// Set backup flags
	cred.SetBackupFlags(true, true)
	assert.True(t, cred.BackupEligible)
	assert.True(t, cred.BackupState)

	// Update flags
	cred.SetBackupFlags(true, false)
	assert.True(t, cred.BackupEligible)
	assert.False(t, cred.BackupState)

	cred.SetBackupFlags(false, false)
	assert.False(t, cred.BackupEligible)
	assert.False(t, cred.BackupState)
}

func TestWebAuthnCredential_CompleteSetup(t *testing.T) {
	userID := uuid.New()
	credentialID := []byte("test-credential-id")
	publicKey := []byte("test-public-key")

	cred := NewWebAuthnCredential(userID, credentialID, publicKey)

	// Setup complete credential
	aaguid := uuid.New()
	cred.AAGUID = &aaguid
	cred.SetAttachment("platform")
	cred.SetTransport([]string{"internal"})
	cred.SetBackupFlags(true, false)

	// Validate the complete credential
	err := cred.Validate()
	assert.NoError(t, err)

	// Check all fields are set correctly
	assert.Equal(t, userID, cred.UserID)
	assert.Equal(t, credentialID, cred.CredentialID)
	assert.Equal(t, publicKey, cred.PublicKey)
	assert.Equal(t, &aaguid, cred.AAGUID)
	assert.Equal(t, "platform", cred.Attachment)
	assert.Equal(t, []string{"internal"}, cred.Transport)
	assert.True(t, cred.BackupEligible)
	assert.False(t, cred.BackupState)
	assert.False(t, cred.CloneWarning)
	assert.Equal(t, uint64(0), cred.SignCount)
}

func TestWebAuthnCredential_CloneDetection(t *testing.T) {
	userID := uuid.New()
	credentialID := []byte("test-credential-id")
	publicKey := []byte("test-public-key")

	cred := NewWebAuthnCredential(userID, credentialID, publicKey)

	// Normal progression should not trigger clone warning
	cred.UpdateSignCount(1)
	assert.False(t, cred.CloneWarning)

	cred.UpdateSignCount(2)
	assert.False(t, cred.CloneWarning)

	cred.UpdateSignCount(5)
	assert.False(t, cred.CloneWarning)

	// Same count should not trigger clone warning
	cred.UpdateSignCount(5)
	assert.False(t, cred.CloneWarning)

	// Decreasing count should trigger clone warning
	cred.UpdateSignCount(3)
	assert.True(t, cred.CloneWarning)

	// Once clone warning is set, it should persist
	cred.UpdateSignCount(10)
	assert.True(t, cred.CloneWarning)
}

func TestWebAuthnCredential_EdgeCases(t *testing.T) {
	userID := uuid.New()
	credentialID := []byte("test-credential-id")
	publicKey := []byte("test-public-key")

	cred := NewWebAuthnCredential(userID, credentialID, publicKey)

	// Test with nil AAGUID (should be valid)
	cred.AAGUID = nil
	err := cred.Validate()
	assert.NoError(t, err)

	// Test with empty transport list
	cred.SetTransport([]string{})
	assert.Equal(t, []string{}, cred.Transport)

	// Test with nil transport list
	cred.SetTransport(nil)
	assert.Nil(t, cred.Transport)

	// Test with empty attachment
	cred.SetAttachment("")
	assert.Equal(t, "", cred.Attachment)
}
