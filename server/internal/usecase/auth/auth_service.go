package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"log/slog"

	"github.com/google/uuid"

	"github.com/bug-breeder/2fair/server/internal/domain/entities"
	"github.com/bug-breeder/2fair/server/internal/domain/repositories"
	"github.com/bug-breeder/2fair/server/internal/infrastructure/jwt"
	"github.com/bug-breeder/2fair/server/internal/infrastructure/oauth"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserNotFound       = errors.New("user not found")
	ErrInvalidToken       = errors.New("invalid token")
	ErrTokenExpired       = errors.New("token expired")
)

// AuthService handles authentication operations
type AuthService struct {
	userRepo     repositories.UserRepository
	tokenService *jwt.TokenService
	oauthService *oauth.OAuthService
	logger       *slog.Logger
}

// NewAuthService creates a new authentication service
func NewAuthService(
	userRepo repositories.UserRepository,
	tokenService *jwt.TokenService,
	oauthService *oauth.OAuthService,
	logger *slog.Logger,
) *AuthService {
	return &AuthService{
		userRepo:     userRepo,
		tokenService: tokenService,
		oauthService: oauthService,
		logger:       logger,
	}
}

// AuthResult represents the result of an authentication operation
type AuthResult struct {
	User         *entities.User `json:"user"`
	AccessToken  string         `json:"access_token"`
	RefreshToken string         `json:"refresh_token"`
	ExpiresAt    int64          `json:"expires_at"`
	TokenType    string         `json:"token_type"`
}

// OAuthAuthRequest represents an OAuth authentication request
type OAuthAuthRequest struct {
	Provider string `json:"provider" validate:"required"`
	Code     string `json:"code" validate:"required"`
	State    string `json:"state" validate:"required"`
}

// RefreshTokenRequest represents a token refresh request
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// AuthenticateWithOAuth handles OAuth authentication flow
func (s *AuthService) AuthenticateWithOAuth(ctx context.Context, req *OAuthAuthRequest) (*AuthResult, error) {
	s.logger.Info("Starting OAuth authentication", "provider", req.Provider)

	// Complete OAuth authentication
	user, err := s.oauthService.CompleteAuth(ctx, req.Provider, req.Code, req.State)
	if err != nil {
		s.logger.Error("OAuth authentication failed", "provider", req.Provider, "error", err)
		return nil, fmt.Errorf("oauth authentication failed: %w", err)
	}

	// Generate JWT tokens
	tokenPair, err := s.tokenService.GenerateTokenPair(user.ID, user.Username, user.Email)
	if err != nil {
		s.logger.Error("Failed to generate tokens", "user_id", user.ID, "error", err)
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	// Update last login time
	user.LastLoginAt = &tokenPair.ExpiresAt
	err = s.userRepo.Update(ctx, user)
	if err != nil {
		s.logger.Warn("Failed to update last login time", "user_id", user.ID, "error", err)
		// Don't fail authentication if we can't update last login
	}

	s.logger.Info("OAuth authentication successful", "user_id", user.ID, "provider", req.Provider)

	return &AuthResult{
		User:         user,
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
		ExpiresAt:    tokenPair.ExpiresAt.Unix(),
		TokenType:    tokenPair.TokenType,
	}, nil
}

// GetOAuthAuthURL generates OAuth authorization URL
func (s *AuthService) GetOAuthAuthURL(provider string) (string, error) {
	s.logger.Info("Generating OAuth auth URL", "provider", provider)

	// Generate secure state parameter
	state, err := s.generateSecureState()
	if err != nil {
		s.logger.Error("Failed to generate state", "error", err)
		return "", fmt.Errorf("failed to generate state: %w", err)
	}

	authURL, err := s.oauthService.GetAuthURL(provider, state)
	if err != nil {
		s.logger.Error("Failed to get OAuth auth URL", "provider", provider, "error", err)
		return "", fmt.Errorf("failed to get auth URL: %w", err)
	}

	s.logger.Info("Generated OAuth auth URL", "provider", provider)
	return authURL, nil
}

// RefreshAccessToken refreshes an access token using a refresh token
func (s *AuthService) RefreshAccessToken(ctx context.Context, req *RefreshTokenRequest) (*AuthResult, error) {
	s.logger.Info("Refreshing access token")

	// Validate refresh token
	userID, err := s.tokenService.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		s.logger.Error("Invalid refresh token", "error", err)
		if errors.Is(err, jwt.ErrExpiredToken) {
			return nil, ErrTokenExpired
		}
		return nil, ErrInvalidToken
	}

	// Get user from database
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		s.logger.Error("User not found for refresh token", "user_id", userID, "error", err)
		return nil, ErrUserNotFound
	}

	// Generate new token pair
	tokenPair, err := s.tokenService.GenerateTokenPair(user.ID, user.Username, user.Email)
	if err != nil {
		s.logger.Error("Failed to generate new tokens", "user_id", user.ID, "error", err)
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	s.logger.Info("Access token refreshed successfully", "user_id", user.ID)

	return &AuthResult{
		User:         user,
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
		ExpiresAt:    tokenPair.ExpiresAt.Unix(),
		TokenType:    tokenPair.TokenType,
	}, nil
}

// ValidateAccessToken validates an access token and returns user information
func (s *AuthService) ValidateAccessToken(tokenString string) (*entities.User, error) {
	// Validate JWT token
	claims, err := s.tokenService.ValidateToken(tokenString)
	if err != nil {
		s.logger.Debug("Invalid access token", "error", err)
		if errors.Is(err, jwt.ErrExpiredToken) {
			return nil, ErrTokenExpired
		}
		return nil, ErrInvalidToken
	}

	// Return user information from claims
	user := &entities.User{
		ID:       claims.UserID,
		Username: claims.Username,
		Email:    claims.Email,
	}

	return user, nil
}

// GetUserByID retrieves a user by ID
func (s *AuthService) GetUserByID(ctx context.Context, userID uuid.UUID) (*entities.User, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		if errors.Is(err, entities.ErrUserNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	return user, nil
}

// GetSupportedOAuthProviders returns list of supported OAuth providers
func (s *AuthService) GetSupportedOAuthProviders() []string {
	return s.oauthService.GetSupportedProviders()
}

// Logout handles user logout (primarily for cleanup/auditing)
func (s *AuthService) Logout(ctx context.Context, userID uuid.UUID) error {
	s.logger.Info("User logout", "user_id", userID)

	// In a JWT-based system, logout is typically handled client-side
	// by removing the token. However, we can log this for auditing purposes.

	// TODO: In the future, we might want to implement token blacklisting
	// or store active tokens in Redis for proper logout handling

	return nil
}

// generateSecureState generates a cryptographically secure state parameter for OAuth
func (s *AuthService) generateSecureState() (string, error) {
	bytes := make([]byte, 32)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}

// UserInfo represents user information response
type UserInfo struct {
	ID          uuid.UUID `json:"id"`
	Username    string    `json:"username"`
	Email       string    `json:"email"`
	DisplayName string    `json:"display_name"`
	CreatedAt   int64     `json:"created_at"`
	UpdatedAt   int64     `json:"updated_at"`
}

// GetUserInfo returns user information for authenticated user
func (s *AuthService) GetUserInfo(ctx context.Context, userID uuid.UUID) (*UserInfo, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		if errors.Is(err, entities.ErrUserNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &UserInfo{
		ID:          user.ID,
		Username:    user.Username,
		Email:       user.Email,
		DisplayName: user.DisplayName,
		CreatedAt:   user.CreatedAt.Unix(),
		UpdatedAt:   user.UpdatedAt.Unix(),
	}, nil
}
