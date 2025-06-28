package services

import (
	"context"
	"net/http"
	"time"

	"github.com/bug-breeder/2fair/server/internal/domain/entities"
        "github.com/bug-breeder/2fair/server/internal/domain/interfaces"
	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
)

// OAuthProvider represents OAuth provider information
type OAuthProvider struct {
	Provider    string `json:"provider"`
	UserID      string `json:"user_id"`
	Email       string `json:"email"`
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	AvatarURL   string `json:"avatar_url,omitempty"`
}

// JWTClaims represents JWT token claims
type JWTClaims struct {
	UserID    string    `json:"user_id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	IssuedAt  time.Time `json:"iat"`
	ExpiresAt time.Time `json:"exp"`
}

// AuthService handles OAuth authentication and JWT token management
type AuthService interface {
	// OAuth flow methods
	GetOAuthAuthURL(provider string, state string) (string, error)
	HandleOAuthCallback(provider string, code string, state string) (*OAuthProvider, error)

	// User registration/login from OAuth
	RegisterOrLoginUser(ctx context.Context, oauthData *OAuthProvider) (*entities.User, error)

	// JWT token management
	GenerateJWT(user *entities.User) (string, error)
	ValidateJWT(token string) (*JWTClaims, error)
	RefreshJWT(token string) (string, error)
}

// WebAuthnCredentialCreation represents credential creation data

// WebAuthnCredentialAssertion represents credential assertion data

// WebAuthnService handles WebAuthn operations for vault encryption
type WebAuthnService interface {
	// Credential registration for vault encryption
	BeginRegistration(ctx context.Context, user *entities.User, authenticatorSelection *protocol.AuthenticatorSelection) (*interfaces.WebAuthnCredentialCreation, error)
	FinishRegistration(ctx context.Context, user *entities.User, sessionData *webauthn.SessionData, request *http.Request) (*entities.WebAuthnCredential, error)

	// Credential assertion for vault key derivation
	BeginAssertion(ctx context.Context, user *entities.User, allowedCredentials []protocol.CredentialDescriptor) (*interfaces.WebAuthnCredentialAssertion, error)
	FinishAssertion(ctx context.Context, user *entities.User, sessionData *webauthn.SessionData, request *http.Request) (*entities.WebAuthnCredential, []byte, error)

	// PRF (Pseudo-Random Function) for key derivation
	DeriveVaultKey(ctx context.Context, user *entities.User, credentialID []byte, prfInput []byte) ([]byte, error)

	// Credential management
	GetUserCredentials(ctx context.Context, userID string) ([]*entities.WebAuthnCredential, error)
	DeleteCredential(ctx context.Context, userID string, credentialID []byte) error
}

// SessionService handles session management
type SessionService interface {
	CreateSession(ctx context.Context, userID string, deviceInfo string) (*entities.DeviceSession, error)
	GetSession(ctx context.Context, sessionID string) (*entities.DeviceSession, error)
	UpdateSession(ctx context.Context, sessionID string, lastActivityAt time.Time) error
	DeleteSession(ctx context.Context, sessionID string) error
	DeleteUserSessions(ctx context.Context, userID string) error
}
