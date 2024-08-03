package auth

import (
	"time"

	"github.com/bug-breeder/2fair/server/configs"
	"github.com/bug-breeder/2fair/server/internal/domain/models"
	"github.com/dgrijalva/jwt-go"
)

var jwtSecret = []byte(configs.GetEnv("AUTH_ACCESS_TOKEN_SECRET"))

// GenerateAccessToken generates a JWT access token
func GenerateAccessToken(userID string) (string, error) {
	expirationTime := time.Now().Add(15 * time.Minute) // 15 minutes
	claims := &models.Claims{
		UserID:    userID,
		SessionID: "",
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// GenerateRefreshToken generates a JWT refresh token
func GenerateRefreshToken(userID, sessionID string) (string, error) {
	expirationTime := time.Now().Add(180 * 24 * time.Hour) // 180 days
	claims := &models.Claims{
		UserID:    userID,
		SessionID: sessionID,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// ValidateToken validates a JWT token and returns the claims
func ValidateToken(tokenStr string) (*models.Claims, error) {
	claims := &models.Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}
	if !token.Valid {
		return nil, jwt.ErrSignatureInvalid
	}
	return claims, nil
}
