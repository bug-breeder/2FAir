package models

import (
	"github.com/dgrijalva/jwt-go"
)

type Claims struct {
	ID        int    `json:"id"`
	UserID    string `json:"user_id"`
	SessionID string `json:"session_id"`
	jwt.StandardClaims
}
