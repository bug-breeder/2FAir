package jwt

import (
	"errors"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/google/uuid"
)

var (
	ErrInvalidToken = errors.New("invalid token")
	ErrExpiredToken = errors.New("token has expired")
	ErrTokenClaims  = errors.New("invalid token claims")
)

// TokenClaims represents the JWT claims structure
type TokenClaims struct {
	UserID   uuid.UUID `json:"user_id"`
	Username string    `json:"username"`
	Email    string    `json:"email"`
	jwt.StandardClaims
}

// TokenService handles JWT token operations
type TokenService struct {
	signingKey        []byte
	issuer            string
	expiration        time.Duration
	refreshExpiration time.Duration
}

// NewTokenService creates a new TokenService instance
func NewTokenService(signingKey string, issuer string, expiration, refreshExpiration time.Duration) *TokenService {
	return &TokenService{
		signingKey:        []byte(signingKey),
		issuer:            issuer,
		expiration:        expiration,
		refreshExpiration: refreshExpiration,
	}
}

// GenerateToken creates a new access token for the user
func (ts *TokenService) GenerateToken(userID uuid.UUID, username, email string) (string, error) {
	now := time.Now()
	claims := &TokenClaims{
		UserID:   userID,
		Username: username,
		Email:    email,
		StandardClaims: jwt.StandardClaims{
			IssuedAt:  now.Unix(),
			ExpiresAt: now.Add(ts.expiration).Unix(),
			NotBefore: now.Unix(),
			Issuer:    ts.issuer,
			Subject:   userID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(ts.signingKey)
}

// GenerateRefreshToken creates a new refresh token for the user
func (ts *TokenService) GenerateRefreshToken(userID uuid.UUID) (string, error) {
	now := time.Now()
	claims := &jwt.StandardClaims{
		IssuedAt:  now.Unix(),
		ExpiresAt: now.Add(ts.refreshExpiration).Unix(),
		NotBefore: now.Unix(),
		Issuer:    ts.issuer,
		Subject:   userID.String(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(ts.signingKey)
}

// ValidateToken validates and parses a JWT token
func (ts *TokenService) ValidateToken(tokenString string) (*TokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &TokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return ts.signingKey, nil
	})

	if err != nil {
		if ve, ok := err.(*jwt.ValidationError); ok {
			if ve.Errors&jwt.ValidationErrorExpired != 0 {
				return nil, ErrExpiredToken
			}
		}
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*TokenClaims)
	if !ok || !token.Valid {
		return nil, ErrTokenClaims
	}

	return claims, nil
}

// ValidateRefreshToken validates a refresh token and returns the user ID
func (ts *TokenService) ValidateRefreshToken(tokenString string) (uuid.UUID, error) {
	token, err := jwt.ParseWithClaims(tokenString, &jwt.StandardClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return ts.signingKey, nil
	})

	if err != nil {
		if ve, ok := err.(*jwt.ValidationError); ok {
			if ve.Errors&jwt.ValidationErrorExpired != 0 {
				return uuid.Nil, ErrExpiredToken
			}
		}
		return uuid.Nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*jwt.StandardClaims)
	if !ok || !token.Valid {
		return uuid.Nil, ErrTokenClaims
	}

	userID, err := uuid.Parse(claims.Subject)
	if err != nil {
		return uuid.Nil, ErrTokenClaims
	}

	return userID, nil
}

// TokenPair represents an access and refresh token pair
type TokenPair struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
	TokenType    string    `json:"token_type"`
}

// GenerateTokenPair creates both access and refresh tokens
func (ts *TokenService) GenerateTokenPair(userID uuid.UUID, username, email string) (*TokenPair, error) {
	accessToken, err := ts.GenerateToken(userID, username, email)
	if err != nil {
		return nil, err
	}

	refreshToken, err := ts.GenerateRefreshToken(userID)
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    time.Now().Add(ts.expiration),
		TokenType:    "Bearer",
	}, nil
}
