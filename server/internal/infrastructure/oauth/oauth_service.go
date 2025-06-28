package oauth

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/url"
	"time"

	"github.com/gorilla/sessions"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/github"
	"github.com/markbates/goth/providers/google"

	"github.com/bug-breeder/2fair/server/internal/domain/entities"
	"github.com/bug-breeder/2fair/server/internal/domain/interfaces"
)

var (
	ErrProviderNotSupported = errors.New("oauth provider not supported")
	ErrAuthenticationFailed = errors.New("oauth authentication failed")
	ErrUserInfoRetrieval    = errors.New("failed to retrieve user information")
)

// ProviderConfig represents OAuth provider configuration
type ProviderConfig struct {
	ClientID     string
	ClientSecret string
	CallbackURL  string
	Scopes       []string
}

// Config represents OAuth service configuration
type Config struct {
	Providers     map[string]ProviderConfig
	SessionSecret string
	SessionMaxAge int
}

// OAuthService handles OAuth authentication with multiple providers
type OAuthService struct {
	config   Config
	userRepo repositories.UserRepository
	logger   *slog.Logger
	store    sessions.Store
}

// NewOAuthService creates a new OAuth service
func NewOAuthService(config Config, userRepo repositories.UserRepository, logger *slog.Logger) *OAuthService {
	// Initialize session store
	store := sessions.NewCookieStore([]byte(config.SessionSecret))
	store.MaxAge(config.SessionMaxAge)
	store.Options.HttpOnly = true
	store.Options.Secure = true // Set to true in production with HTTPS
	store.Options.SameSite = 1  // Strict

	gothic.Store = store

	service := &OAuthService{
		config:   config,
		userRepo: userRepo,
		logger:   logger,
		store:    store,
	}

	// Initialize providers
	service.initializeProviders()

	return service
}

// initializeProviders sets up OAuth providers based on configuration
func (s *OAuthService) initializeProviders() {
	var providers []goth.Provider

	// Google OAuth
	if googleConfig, exists := s.config.Providers["google"]; exists {
		scopes := googleConfig.Scopes
		if len(scopes) == 0 {
			scopes = []string{"email", "profile"}
		}
		providers = append(providers, google.New(
			googleConfig.ClientID,
			googleConfig.ClientSecret,
			googleConfig.CallbackURL,
			scopes...,
		))
		s.logger.Info("Google OAuth provider initialized")
	}

	// Microsoft OAuth - temporarily disabled due to import issues
	// if microsoftConfig, exists := s.config.Providers["microsoft"]; exists {
	// 	scopes := microsoftConfig.Scopes
	// 	if len(scopes) == 0 {
	// 		scopes = []string{"https://graph.microsoft.com/User.Read"}
	// 	}
	// 	providers = append(providers, microsoft.New(
	// 		microsoftConfig.ClientID,
	// 		microsoftConfig.ClientSecret,
	// 		microsoftConfig.CallbackURL,
	// 		scopes...,
	// 	))
	// 	s.logger.Info("Microsoft OAuth provider initialized")
	// }

	// GitHub OAuth
	if githubConfig, exists := s.config.Providers["github"]; exists {
		scopes := githubConfig.Scopes
		if len(scopes) == 0 {
			scopes = []string{"user:email"}
		}
		providers = append(providers, github.New(
			githubConfig.ClientID,
			githubConfig.ClientSecret,
			githubConfig.CallbackURL,
			scopes...,
		))
		s.logger.Info("GitHub OAuth provider initialized")
	}

	goth.UseProviders(providers...)
	s.logger.Info("OAuth providers initialized", "count", len(providers))
}

// GetSupportedProviders returns a list of supported OAuth providers
func (s *OAuthService) GetSupportedProviders() []string {
	var providers []string
	for provider := range s.config.Providers {
		providers = append(providers, provider)
	}
	return providers
}

// GetAuthURL returns the OAuth authorization URL for the specified provider
func (s *OAuthService) GetAuthURL(provider, state string) (string, error) {
	if !s.isProviderSupported(provider) {
		return "", ErrProviderNotSupported
	}

	// Get the provider
	gothProvider, err := goth.GetProvider(provider)
	if err != nil {
		s.logger.Error("Failed to get OAuth provider", "provider", provider, "error", err)
		return "", ErrProviderNotSupported
	}

	// Begin auth process
	session, err := gothProvider.BeginAuth(state)
	if err != nil {
		s.logger.Error("Failed to begin OAuth", "provider", provider, "error", err)
		return "", ErrAuthenticationFailed
	}

	authURL, err := session.GetAuthURL()
	if err != nil {
		s.logger.Error("Failed to get auth URL", "provider", provider, "error", err)
		return "", ErrAuthenticationFailed
	}

	s.logger.Info("Generated OAuth auth URL", "provider", provider)
	return authURL, nil
}

// CompleteAuth completes the OAuth authentication flow
func (s *OAuthService) CompleteAuth(ctx context.Context, provider, code, state string) (*entities.User, error) {
	if !s.isProviderSupported(provider) {
		return nil, ErrProviderNotSupported
	}

	// Get the provider
	gothProvider, err := goth.GetProvider(provider)
	if err != nil {
		s.logger.Error("Failed to get OAuth provider", "provider", provider, "error", err)
		return nil, ErrProviderNotSupported
	}

	// Create session from state
	session, err := gothProvider.UnmarshalSession(state)
	if err != nil {
		s.logger.Error("Failed to unmarshal session", "provider", provider, "error", err)
		return nil, ErrAuthenticationFailed
	}

	// Exchange authorization code for access token
	_, err = session.Authorize(gothProvider, url.Values{"code": {code}})
	if err != nil {
		s.logger.Error("Failed to authorize", "provider", provider, "error", err)
		return nil, ErrAuthenticationFailed
	}

	// Get user information
	gothUser, err := gothProvider.FetchUser(session)
	if err != nil {
		s.logger.Error("Failed to fetch user", "provider", provider, "error", err)
		return nil, ErrUserInfoRetrieval
	}

	s.logger.Info("OAuth user fetched successfully",
		"provider", provider,
		"user_id", gothUser.UserID,
		"email", gothUser.Email)

	// Create or update user
	user, err := s.createOrUpdateUser(ctx, &gothUser, provider)
	if err != nil {
		s.logger.Error("Failed to create/update user", "error", err)
		return nil, err
	}

	return user, nil
}

// createOrUpdateUser creates a new user or updates existing user from OAuth data
func (s *OAuthService) createOrUpdateUser(ctx context.Context, gothUser *goth.User, provider string) (*entities.User, error) {
	// Try to find existing user by email
	existingUser, err := s.userRepo.GetByEmail(ctx, gothUser.Email)
	if err != nil && !errors.Is(err, entities.ErrUserNotFound) {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}

	if existingUser != nil {
		// Update existing user
		existingUser.DisplayName = gothUser.Name
		existingUser.UpdatedAt = time.Now()

		err = s.userRepo.Update(ctx, existingUser)
		if err != nil {
			return nil, fmt.Errorf("failed to update user: %w", err)
		}

		s.logger.Info("Updated existing user", "user_id", existingUser.ID, "email", existingUser.Email)
		return existingUser, nil
	}

	// Create new user
	username := s.generateUsername(gothUser.Email, gothUser.NickName)

	newUser := &entities.User{
		Username:    username,
		Email:       gothUser.Email,
		DisplayName: gothUser.Name,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	err = s.userRepo.Create(ctx, newUser)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	s.logger.Info("Created new user", "user_id", newUser.ID, "email", newUser.Email, "provider", provider)
	return newUser, nil
}

// generateUsername generates a unique username from email or nickname
func (s *OAuthService) generateUsername(email, nickname string) string {
	if nickname != "" {
		return nickname
	}

	// Extract username from email
	if email != "" {
		at := 0
		for i, c := range email {
			if c == '@' {
				at = i
				break
			}
		}
		if at > 0 {
			return email[:at]
		}
	}

	// Fallback to random username
	return "user_" + time.Now().Format("20060102150405")
}

// isProviderSupported checks if the provider is supported
func (s *OAuthService) isProviderSupported(provider string) bool {
	_, exists := s.config.Providers[provider]
	return exists
}

// GetUserProfile retrieves user profile information from OAuth provider
func (s *OAuthService) GetUserProfile(ctx context.Context, provider, accessToken string) (*goth.User, error) {
	if !s.isProviderSupported(provider) {
		return nil, ErrProviderNotSupported
	}

	// This function needs to be implemented properly with the correct session handling
	// For now, returning an error to indicate it's not implemented
	return nil, errors.New("not implemented")
}
