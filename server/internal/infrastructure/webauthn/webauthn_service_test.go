package webauthn

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"github.com/bug-breeder/2fair/server/internal/domain/entities"
)

// mockWebAuthnCredentialRepository implements WebAuthnCredentialRepository for testing
type mockWebAuthnCredentialRepository struct {
	mock.Mock
}

func (m *mockWebAuthnCredentialRepository) Create(ctx context.Context, credential *entities.WebAuthnCredential) error {
	args := m.Called(ctx, credential)
	return args.Error(0)
}

func (m *mockWebAuthnCredentialRepository) GetByID(ctx context.Context, id uuid.UUID) (*entities.WebAuthnCredential, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*entities.WebAuthnCredential), args.Error(1)
}

func (m *mockWebAuthnCredentialRepository) GetByCredentialID(ctx context.Context, credentialID []byte) (*entities.WebAuthnCredential, error) {
	args := m.Called(ctx, credentialID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entities.WebAuthnCredential), args.Error(1)
}

func (m *mockWebAuthnCredentialRepository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]*entities.WebAuthnCredential, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]*entities.WebAuthnCredential), args.Error(1)
}

func (m *mockWebAuthnCredentialRepository) Update(ctx context.Context, credential *entities.WebAuthnCredential) error {
	args := m.Called(ctx, credential)
	return args.Error(0)
}

func (m *mockWebAuthnCredentialRepository) UpdateSignCount(ctx context.Context, credentialID []byte, signCount uint64) error {
	args := m.Called(ctx, credentialID, signCount)
	return args.Error(0)
}

func (m *mockWebAuthnCredentialRepository) UpdateCloneWarning(ctx context.Context, credentialID []byte, cloneWarning bool) error {
	args := m.Called(ctx, credentialID, cloneWarning)
	return args.Error(0)
}

func (m *mockWebAuthnCredentialRepository) Delete(ctx context.Context, credentialID []byte, userID uuid.UUID) error {
	args := m.Called(ctx, credentialID, userID)
	return args.Error(0)
}

func (m *mockWebAuthnCredentialRepository) ExistsByCredentialID(ctx context.Context, credentialID []byte) (bool, error) {
	args := m.Called(ctx, credentialID)
	return args.Bool(0), args.Error(1)
}

func TestNewWebAuthnService(t *testing.T) {
	credRepo := &mockWebAuthnCredentialRepository{}
	userRepo := newMockUserRepository()

	service, err := NewWebAuthnService(
		"localhost",
		"2FAir Test",
		[]string{"http://localhost:3000"},
		credRepo,
		userRepo,
	)

	require.NoError(t, err)
	assert.NotNil(t, service)
}

func TestNewWebAuthnService_InvalidConfig(t *testing.T) {
	credRepo := &mockWebAuthnCredentialRepository{}
	userRepo := newMockUserRepository()

	tests := []struct {
		name        string
		rpID        string
		rpName      string
		rpOrigins   []string
		expectError bool
	}{
		{
			name:        "empty RPID",
			rpID:        "",
			rpName:      "2FAir Test",
			rpOrigins:   []string{"http://localhost:3000"},
			expectError: true,
		},
		{
			name:        "empty RP name",
			rpID:        "localhost",
			rpName:      "",
			rpOrigins:   []string{"http://localhost:3000"},
			expectError: true,
		},
		{
			name:        "empty origins",
			rpID:        "localhost",
			rpName:      "2FAir Test",
			rpOrigins:   []string{},
			expectError: true,
		},
		{
			name:        "valid config",
			rpID:        "localhost",
			rpName:      "2FAir Test",
			rpOrigins:   []string{"http://localhost:3000"},
			expectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			service, err := NewWebAuthnService(
				tt.rpID,
				tt.rpName,
				tt.rpOrigins,
				credRepo,
				userRepo,
			)

			if tt.expectError {
				assert.Error(t, err)
				assert.Nil(t, service)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, service)
			}
		})
	}
}

func TestWebAuthnService_GetUserCredentials(t *testing.T) {
	credRepo := &mockWebAuthnCredentialRepository{}
	userRepo := newMockUserRepository()

	service, err := NewWebAuthnService(
		"localhost",
		"2FAir Test",
		[]string{"http://localhost:3000"},
		credRepo,
		userRepo,
	)
	require.NoError(t, err)

	userID := uuid.New()
	expectedCreds := []*entities.WebAuthnCredential{
		entities.NewWebAuthnCredential(userID, []byte("cred1"), []byte("pubkey1")),
		entities.NewWebAuthnCredential(userID, []byte("cred2"), []byte("pubkey2")),
	}

	// Mock the repository call
	credRepo.On("GetByUserID", mock.Anything, userID).Return(expectedCreds, nil)

	creds, err := service.GetUserCredentials(context.Background(), userID.String())
	require.NoError(t, err)
	assert.Len(t, creds, 2)
	assert.Equal(t, expectedCreds, creds)

	credRepo.AssertExpectations(t)
}

func TestWebAuthnService_GetUserCredentials_InvalidUserID(t *testing.T) {
	credRepo := &mockWebAuthnCredentialRepository{}
	userRepo := newMockUserRepository()

	service, err := NewWebAuthnService(
		"localhost",
		"2FAir Test",
		[]string{"http://localhost:3000"},
		credRepo,
		userRepo,
	)
	require.NoError(t, err)

	// Test with invalid UUID
	creds, err := service.GetUserCredentials(context.Background(), "invalid-uuid")
	assert.Error(t, err)
	assert.Nil(t, creds)
	assert.Contains(t, err.Error(), "invalid user ID format")
}

func TestWebAuthnService_GetUserCredentials_NoCredentials(t *testing.T) {
	credRepo := &mockWebAuthnCredentialRepository{}
	userRepo := newMockUserRepository()

	service, err := NewWebAuthnService(
		"localhost",
		"2FAir Test",
		[]string{"http://localhost:3000"},
		credRepo,
		userRepo,
	)
	require.NoError(t, err)

	userID := uuid.New()

	// Mock empty credentials
	credRepo.On("GetByUserID", mock.Anything, userID).Return([]*entities.WebAuthnCredential{}, nil)

	creds, err := service.GetUserCredentials(context.Background(), userID.String())
	require.NoError(t, err)
	assert.Len(t, creds, 0)

	credRepo.AssertExpectations(t)
}

func TestWebAuthnService_DeleteCredential(t *testing.T) {
	credRepo := &mockWebAuthnCredentialRepository{}
	userRepo := newMockUserRepository()

	service, err := NewWebAuthnService(
		"localhost",
		"2FAir Test",
		[]string{"http://localhost:3000"},
		credRepo,
		userRepo,
	)
	require.NoError(t, err)

	userID := uuid.New()
	credentialID := []byte("test-credential-id")

	// Mock the repository call
	credRepo.On("Delete", mock.Anything, credentialID, userID).Return(nil)

	err = service.DeleteCredential(context.Background(), userID.String(), credentialID)
	require.NoError(t, err)

	credRepo.AssertExpectations(t)
}

func TestWebAuthnService_DeleteCredential_InvalidUserID(t *testing.T) {
	credRepo := &mockWebAuthnCredentialRepository{}
	userRepo := newMockUserRepository()

	service, err := NewWebAuthnService(
		"localhost",
		"2FAir Test",
		[]string{"http://localhost:3000"},
		credRepo,
		userRepo,
	)
	require.NoError(t, err)

	credentialID := []byte("test-credential-id")

	// Test with invalid UUID
	err = service.DeleteCredential(context.Background(), "invalid-uuid", credentialID)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid user ID format")
}

func TestWebAuthnService_DeriveVaultKey(t *testing.T) {
	credRepo := &mockWebAuthnCredentialRepository{}
	userRepo := newMockUserRepository()

	service, err := NewWebAuthnService(
		"localhost",
		"2FAir Test",
		[]string{"http://localhost:3000"},
		credRepo,
		userRepo,
	)
	require.NoError(t, err)

	user := entities.NewUser("testuser", "test@example.com", "Test User")
	credentialID := []byte("test-credential-id")
	prfInput := []byte("test-prf-input")

	// This method should return an error indicating it should be called through assertion
	vaultKey, err := service.DeriveVaultKey(context.Background(), user, credentialID, prfInput)
	assert.Error(t, err)
	assert.Nil(t, vaultKey)
	assert.Contains(t, err.Error(), "should be called through the assertion flow")
}

func TestWebAuthnUser_Interface(t *testing.T) {
	// Test the webAuthnUser struct that implements webauthn.User interface
	user := entities.NewUser("testuser", "test@example.com", "Test User")

	// Create some mock credentials
	cred1 := entities.NewWebAuthnCredential(user.ID, []byte("cred1"), []byte("pubkey1"))
	cred1.SetTransport([]string{"usb", "nfc"})
	cred1.SetBackupFlags(true, false)

	cred2 := entities.NewWebAuthnCredential(user.ID, []byte("cred2"), []byte("pubkey2"))
	cred2.SetTransport([]string{"internal"})

	credentials := []*entities.WebAuthnCredential{cred1, cred2}

	// Create webAuthnUser (this is internal to the service)
	// We test the interface compliance indirectly through the service behavior
	// since webAuthnUser is not exported

	// Test that we can create a service and it uses the webAuthnUser properly
	credRepo := &mockWebAuthnCredentialRepository{}
	userRepo := newMockUserRepository()

	service, err := NewWebAuthnService(
		"localhost",
		"2FAir Test",
		[]string{"http://localhost:3000"},
		credRepo,
		userRepo,
	)
	require.NoError(t, err)
	assert.NotNil(t, service)

	// The actual webAuthn operations require an HTTP request context,
	// so we focus on testing the credential management operations
	credRepo.On("GetByUserID", mock.Anything, user.ID).Return(credentials, nil)

	retrievedCreds, err := service.GetUserCredentials(context.Background(), user.ID.String())
	require.NoError(t, err)
	assert.Len(t, retrievedCreds, 2)

	credRepo.AssertExpectations(t)
}

func TestWebAuthnService_RepositoryErrors(t *testing.T) {
	credRepo := &mockWebAuthnCredentialRepository{}
	userRepo := newMockUserRepository()

	service, err := NewWebAuthnService(
		"localhost",
		"2FAir Test",
		[]string{"http://localhost:3000"},
		credRepo,
		userRepo,
	)
	require.NoError(t, err)

	userID := uuid.New()

	t.Run("repository error on get credentials", func(t *testing.T) {
		credRepo.On("GetByUserID", mock.Anything, userID).Return(
			[]*entities.WebAuthnCredential{},
			entities.ErrCredentialNotFound,
		).Once()

		creds, err := service.GetUserCredentials(context.Background(), userID.String())
		assert.Error(t, err)
		assert.Nil(t, creds)
		assert.Contains(t, err.Error(), "failed to get WebAuthn credentials")
	})

	t.Run("repository error on delete credential", func(t *testing.T) {
		credentialID := []byte("test-credential-id")

		credRepo.On("Delete", mock.Anything, credentialID, userID).Return(
			entities.ErrCredentialNotFound,
		).Once()

		err := service.DeleteCredential(context.Background(), userID.String(), credentialID)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "failed to delete WebAuthn credential")
	})

	credRepo.AssertExpectations(t)
}
