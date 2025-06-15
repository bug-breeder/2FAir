package services

import (
	"context"
	"fmt"
	"time"

	"github.com/bug-breeder/2fair/server/internal/domain/entities"
	"github.com/bug-breeder/2fair/server/internal/domain/repositories"
	"github.com/bug-breeder/2fair/server/internal/domain/services"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/markbates/goth"
	"github.com/markbates/goth/providers/github"
	"github.com/markbates/goth/providers/google"
)

type authService struct {
	userRepo  repositories.UserRepository
	jwtSecret []byte
	jwtExpiry time.Duration
	serverURL string
}

// NewAuthService creates a new authentication service
func NewAuthService(
	userRepo repositories.UserRepository,
	jwtSecret string,
	jwtExpiry time.Duration,
	serverURL string,
	googleClientID string,
	googleClientSecret string,
	githubClientID string,
	githubClientSecret string,
) services.AuthService {
	// Configure OAuth providers
	goth.UseProviders(
		google.New(
			googleClientID,
			googleClientSecret,
			fmt.Sprintf("%s/auth/google/callback", serverURL),
		),
		github.New(
			githubClientID,
			githubClientSecret,
			fmt.Sprintf("%s/auth/github/callback", serverURL),
		),
	)

	return &authService{
		userRepo:  userRepo,
		jwtSecret: []byte(jwtSecret),
		jwtExpiry: jwtExpiry,
		serverURL: serverURL,
	}
}

// GetOAuthAuthURL generates OAuth authorization URL
func (a *authService) GetOAuthAuthURL(provider string, state string) (string, error) {
	// Validate provider
	switch provider {
	case "google", "github":
		// Provider is valid
	default:
		return "", fmt.Errorf("unsupported OAuth provider: %s", provider)
	}

	// Create authentication URL
	authURL := fmt.Sprintf("%s/auth/%s?state=%s", a.serverURL, provider, state)
	return authURL, nil
}

// HandleOAuthCallback processes OAuth callback
func (a *authService) HandleOAuthCallback(provider string, code string, state string) (*services.OAuthProvider, error) {
	// This would typically be handled by the Gin handler using gothic.CompleteUserAuth
	// For now, return a placeholder implementation
	return nil, fmt.Errorf("handleOAuthCallback should be implemented in the HTTP handler")
}

// RegisterOrLoginUser registers or logs in a user from OAuth data
func (a *authService) RegisterOrLoginUser(ctx context.Context, oauthData *services.OAuthProvider) (*entities.User, error) {
	// Try to find existing user by email
	existingUser, err := a.userRepo.GetByEmail(ctx, oauthData.Email)
	if err != nil && err != entities.ErrUserNotFound {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}

	if existingUser != nil {
		// Update last login using the entity method
		existingUser.UpdateLastLogin()

		if err := a.userRepo.Update(ctx, existingUser); err != nil {
			return nil, fmt.Errorf("failed to update user login time: %w", err)
		}

		return existingUser, nil
	}

	// Create new user
	now := time.Now()
	user := &entities.User{
		ID:          uuid.New(),
		Username:    oauthData.Username,
		Email:       oauthData.Email,
		DisplayName: oauthData.DisplayName,
		IsActive:    true,
		CreatedAt:   now,
		UpdatedAt:   now,
		LastLoginAt: &now,
	}

	// Validate user data
	if err := user.Validate(); err != nil {
		return nil, fmt.Errorf("invalid user data: %w", err)
	}

	// Create user
	if err := a.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}

// GenerateJWT creates a JWT token for the user
func (a *authService) GenerateJWT(user *entities.User) (string, error) {
	now := time.Now()
	expiresAt := now.Add(a.jwtExpiry)

	claims := &services.JWTClaims{
		UserID:    user.ID.String(),
		Username:  user.Username,
		Email:     user.Email,
		IssuedAt:  now,
		ExpiresAt: expiresAt,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  claims.UserID,
		"username": claims.Username,
		"email":    claims.Email,
		"iat":      claims.IssuedAt.Unix(),
		"exp":      claims.ExpiresAt.Unix(),
	})

	tokenString, err := token.SignedString(a.jwtSecret)
	if err != nil {
		return "", fmt.Errorf("failed to sign JWT token: %w", err)
	}

	return tokenString, nil
}

// ValidateJWT validates and parses a JWT token
func (a *authService) ValidateJWT(tokenString string) (*services.JWTClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return a.jwtSecret, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse JWT token: %w", err)
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid JWT token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("invalid JWT claims format")
	}

	// Extract claims
	userID, ok := claims["user_id"].(string)
	if !ok {
		return nil, fmt.Errorf("invalid user_id in JWT claims")
	}

	username, ok := claims["username"].(string)
	if !ok {
		return nil, fmt.Errorf("invalid username in JWT claims")
	}

	email, ok := claims["email"].(string)
	if !ok {
		return nil, fmt.Errorf("invalid email in JWT claims")
	}

	iat, ok := claims["iat"].(float64)
	if !ok {
		return nil, fmt.Errorf("invalid iat in JWT claims")
	}

	exp, ok := claims["exp"].(float64)
	if !ok {
		return nil, fmt.Errorf("invalid exp in JWT claims")
	}

	return &services.JWTClaims{
		UserID:    userID,
		Username:  username,
		Email:     email,
		IssuedAt:  time.Unix(int64(iat), 0),
		ExpiresAt: time.Unix(int64(exp), 0),
	}, nil
}

// RefreshJWT refreshes a JWT token
func (a *authService) RefreshJWT(tokenString string) (string, error) {
	claims, err := a.ValidateJWT(tokenString)
	if err != nil {
		return "", fmt.Errorf("failed to validate existing token: %w", err)
	}

	// Check if token is expired
	if time.Now().After(claims.ExpiresAt) {
		return "", fmt.Errorf("token is expired")
	}

	// Generate new token with same claims but updated timestamps
	now := time.Now()
	expiresAt := now.Add(a.jwtExpiry)

	newClaims := &services.JWTClaims{
		UserID:    claims.UserID,
		Username:  claims.Username,
		Email:     claims.Email,
		IssuedAt:  now,
		ExpiresAt: expiresAt,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  newClaims.UserID,
		"username": newClaims.Username,
		"email":    newClaims.Email,
		"iat":      newClaims.IssuedAt.Unix(),
		"exp":      newClaims.ExpiresAt.Unix(),
	})

	newTokenString, err := token.SignedString(a.jwtSecret)
	if err != nil {
		return "", fmt.Errorf("failed to sign new JWT token: %w", err)
	}

	return newTokenString, nil
}
