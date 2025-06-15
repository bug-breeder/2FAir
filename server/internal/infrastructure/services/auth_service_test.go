package services

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/bug-breeder/2fair/server/internal/domain/entities"
	"github.com/bug-breeder/2fair/server/internal/domain/services"
)

// mockUserRepository implements UserRepository for testing
type mockUserRepository struct {
	users  map[string]*entities.User
	emails map[string]*entities.User
}

func newMockUserRepository() *mockUserRepository {
	return &mockUserRepository{
		users:  make(map[string]*entities.User),
		emails: make(map[string]*entities.User),
	}
}

func (m *mockUserRepository) GetByID(ctx context.Context, id uuid.UUID) (*entities.User, error) {
	user, exists := m.users[id.String()]
	if !exists {
		return nil, entities.ErrUserNotFound
	}
	return user, nil
}

func (m *mockUserRepository) GetByEmail(ctx context.Context, email string) (*entities.User, error) {
	user, exists := m.emails[email]
	if !exists {
		return nil, entities.ErrUserNotFound
	}
	return user, nil
}

func (m *mockUserRepository) GetByUsername(ctx context.Context, username string) (*entities.User, error) {
	for _, user := range m.users {
		if user.Username == username {
			return user, nil
		}
	}
	return nil, entities.ErrUserNotFound
}

func (m *mockUserRepository) Create(ctx context.Context, user *entities.User) error {
	// Check if email already exists
	if _, exists := m.emails[user.Email]; exists {
		return entities.ErrUserAlreadyExists
	}

	m.users[user.ID.String()] = user
	m.emails[user.Email] = user
	return nil
}

func (m *mockUserRepository) Update(ctx context.Context, user *entities.User) error {
	if _, exists := m.users[user.ID.String()]; !exists {
		return entities.ErrUserNotFound
	}

	// Update in both maps
	delete(m.emails, m.users[user.ID.String()].Email) // Remove old email mapping
	m.users[user.ID.String()] = user
	m.emails[user.Email] = user
	return nil
}

func (m *mockUserRepository) UpdateLastLogin(ctx context.Context, userID uuid.UUID) error {
	user, exists := m.users[userID.String()]
	if !exists {
		return entities.ErrUserNotFound
	}

	user.UpdateLastLogin()
	return nil
}

func (m *mockUserRepository) Deactivate(ctx context.Context, userID uuid.UUID) error {
	user, exists := m.users[userID.String()]
	if !exists {
		return entities.ErrUserNotFound
	}

	user.Deactivate()
	return nil
}

func (m *mockUserRepository) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	_, exists := m.emails[email]
	return exists, nil
}

func (m *mockUserRepository) ExistsByUsername(ctx context.Context, username string) (bool, error) {
	for _, user := range m.users {
		if user.Username == username {
			return true, nil
		}
	}
	return false, nil
}

func TestNewAuthService(t *testing.T) {
	userRepo := newMockUserRepository()
	signingKey := "test-signing-key"
	jwtExpiry := 1 * time.Hour
	serverURL := "http://localhost:8080"
	googleClientID := "google-client-id"
	googleClientSecret := "google-client-secret"
	githubClientID := "github-client-id"
	githubClientSecret := "github-client-secret"

	authService := NewAuthService(
		userRepo,
		signingKey,
		jwtExpiry,
		serverURL,
		googleClientID,
		googleClientSecret,
		githubClientID,
		githubClientSecret,
	)

	assert.NotNil(t, authService)
}

func TestAuthService_GenerateJWT(t *testing.T) {
	userRepo := newMockUserRepository()
	authService := NewAuthService(
		userRepo,
		"test-signing-key",
		1*time.Hour,
		"http://localhost:8080",
		"google-client-id",
		"google-client-secret",
		"github-client-id",
		"github-client-secret",
	)

	user := entities.NewUser("testuser", "test@example.com", "Test User")

	token, err := authService.GenerateJWT(user)
	require.NoError(t, err)
	assert.NotEmpty(t, token)

	// Token should be a valid JWT format (three parts separated by dots)
	parts := strings.Split(token, ".")
	assert.Len(t, parts, 3)
}

func TestAuthService_ValidateJWT_Success(t *testing.T) {
	userRepo := newMockUserRepository()
	authService := NewAuthService(
		userRepo,
		"test-signing-key",
		1*time.Hour,
		"http://localhost:8080",
		"google-client-id",
		"google-client-secret",
		"github-client-id",
		"github-client-secret",
	)

	user := entities.NewUser("testuser", "test@example.com", "Test User")

	// Generate token
	token, err := authService.GenerateJWT(user)
	require.NoError(t, err)

	// Validate token
	claims, err := authService.ValidateJWT(token)
	require.NoError(t, err)
	require.NotNil(t, claims)

	assert.Equal(t, user.ID.String(), claims.UserID)
	assert.Equal(t, user.Username, claims.Username)
	assert.Equal(t, user.Email, claims.Email)
	assert.False(t, claims.IssuedAt.IsZero())
	assert.False(t, claims.ExpiresAt.IsZero())
	assert.True(t, claims.ExpiresAt.After(claims.IssuedAt))
}

func TestAuthService_ValidateJWT_InvalidToken(t *testing.T) {
	userRepo := newMockUserRepository()
	authService := NewAuthService(
		userRepo,
		"test-signing-key",
		1*time.Hour,
		"http://localhost:8080",
		"google-client-id",
		"google-client-secret",
		"github-client-id",
		"github-client-secret",
	)

	tests := []struct {
		name  string
		token string
	}{
		{
			name:  "empty token",
			token: "",
		},
		{
			name:  "invalid format",
			token: "invalid.token",
		},
		{
			name:  "malformed JWT",
			token: "not.a.jwt.token",
		},
		{
			name:  "invalid signature",
			token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGVzdCIsInVzZXJuYW1lIjoidGVzdCIsImVtYWlsIjoidGVzdCJ9.invalid",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			claims, err := authService.ValidateJWT(tt.token)
			assert.Error(t, err)
			assert.Nil(t, claims)
		})
	}
}

func TestAuthService_ValidateJWT_ExpiredToken(t *testing.T) {
	userRepo := newMockUserRepository()
	authService := NewAuthService(
		userRepo,
		"test-signing-key",
		1*time.Millisecond, // Very short expiry
		"http://localhost:8080",
		"google-client-id",
		"google-client-secret",
		"github-client-id",
		"github-client-secret",
	)

	user := entities.NewUser("testuser", "test@example.com", "Test User")

	// Generate token
	token, err := authService.GenerateJWT(user)
	require.NoError(t, err)

	// Wait for token to expire
	time.Sleep(10 * time.Millisecond)

	// Try to validate expired token
	claims, err := authService.ValidateJWT(token)
	assert.Error(t, err)
	assert.Nil(t, claims)
}

func TestAuthService_ValidateJWT_WrongSigningKey(t *testing.T) {
	userRepo := newMockUserRepository()

	// Create service with one key
	authService1 := NewAuthService(
		userRepo,
		"signing-key-1",
		1*time.Hour,
		"http://localhost:8080",
		"google-client-id",
		"google-client-secret",
		"github-client-id",
		"github-client-secret",
	)

	// Create service with different key
	authService2 := NewAuthService(
		userRepo,
		"signing-key-2",
		1*time.Hour,
		"http://localhost:8080",
		"google-client-id",
		"google-client-secret",
		"github-client-id",
		"github-client-secret",
	)

	user := entities.NewUser("testuser", "test@example.com", "Test User")

	// Generate token with first service
	token, err := authService1.GenerateJWT(user)
	require.NoError(t, err)

	// Try to validate with second service (different key)
	claims, err := authService2.ValidateJWT(token)
	assert.Error(t, err)
	assert.Nil(t, claims)
}

func TestAuthService_RegisterOrLoginUser(t *testing.T) {
	userRepo := newMockUserRepository()
	authService := NewAuthService(
		userRepo,
		"test-signing-key",
		1*time.Hour,
		"http://localhost:8080",
		"google-client-id",
		"google-client-secret",
		"github-client-id",
		"github-client-secret",
	)

	t.Run("register new user", func(t *testing.T) {
		oauthData := &services.OAuthProvider{
			Provider:    "google",
			UserID:      "google-123",
			Email:       "new@example.com",
			Username:    "newuser",
			DisplayName: "New User",
		}

		user, err := authService.RegisterOrLoginUser(context.Background(), oauthData)
		require.NoError(t, err)
		require.NotNil(t, user)

		assert.Equal(t, oauthData.Email, user.Email)
		assert.Equal(t, oauthData.Username, user.Username)
		assert.Equal(t, oauthData.DisplayName, user.DisplayName)
		assert.True(t, user.IsActive)
	})

	t.Run("login existing user", func(t *testing.T) {
		// Create initial user
		email := "existing@example.com"
		existingUser := entities.NewUser("oldusername", email, "Old Name")
		err := userRepo.Create(context.Background(), existingUser)
		require.NoError(t, err)

		// Login with OAuth data
		oauthData := &services.OAuthProvider{
			Provider:    "github",
			UserID:      "github-456",
			Email:       email,
			Username:    "newusername",
			DisplayName: "New Display Name",
		}

		loggedInUser, err := authService.RegisterOrLoginUser(context.Background(), oauthData)
		require.NoError(t, err)
		require.NotNil(t, loggedInUser)

		assert.Equal(t, existingUser.ID, loggedInUser.ID) // Same ID
		assert.Equal(t, email, loggedInUser.Email)        // Same email
		// Note: The actual behavior depends on the implementation
		// Some systems update user info from OAuth, others don't
	})
}

func TestAuthService_RefreshJWT(t *testing.T) {
	userRepo := newMockUserRepository()
	authService := NewAuthService(
		userRepo,
		"test-signing-key",
		1*time.Hour,
		"http://localhost:8080",
		"google-client-id",
		"google-client-secret",
		"github-client-id",
		"github-client-secret",
	)

	user := entities.NewUser("testuser", "test@example.com", "Test User")

	// Generate initial token
	originalToken, err := authService.GenerateJWT(user)
	require.NoError(t, err)

	// Wait to ensure meaningful time difference between tokens
	time.Sleep(1 * time.Second)

	// Refresh the token
	newToken, err := authService.RefreshJWT(originalToken)
	require.NoError(t, err)
	assert.NotEmpty(t, newToken)
	assert.NotEqual(t, originalToken, newToken)

	// Validate the new token
	claims, err := authService.ValidateJWT(newToken)
	require.NoError(t, err)
	assert.Equal(t, user.ID.String(), claims.UserID)
}

func TestAuthService_TokenValidation_EdgeCases(t *testing.T) {
	userRepo := newMockUserRepository()
	authService := NewAuthService(
		userRepo,
		"test-signing-key",
		1*time.Hour,
		"http://localhost:8080",
		"google-client-id",
		"google-client-secret",
		"github-client-id",
		"github-client-secret",
	)

	t.Run("token with special characters in claims", func(t *testing.T) {
		user := entities.NewUser("test-user_123", "test+label@example.com", "Test User (Special)")

		token, err := authService.GenerateJWT(user)
		require.NoError(t, err)

		claims, err := authService.ValidateJWT(token)
		require.NoError(t, err)
		assert.Equal(t, user.Username, claims.Username)
		assert.Equal(t, user.Email, claims.Email)
	})

	t.Run("very long display name", func(t *testing.T) {
		longName := "Very Long Display Name That Contains Many Characters And Should Still Work Fine"
		user := entities.NewUser("testuser", "test@example.com", longName)

		token, err := authService.GenerateJWT(user)
		require.NoError(t, err)

		claims, err := authService.ValidateJWT(token)
		require.NoError(t, err)
		assert.Equal(t, user.Username, claims.Username)
	})
}
