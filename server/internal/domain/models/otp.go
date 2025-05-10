package models

import (
	"time"
)

type OTP struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Issuer    string    `json:"issuer"`
	Label     string    `json:"label"`
	Secret    string    `json:"secret"`
	Algorithm string    `json:"algorithm"`
	Digits    int       `json:"digits"`
	Period    int       `json:"period"`
	Counter   int       `json:"counter"`
	Method    string    `json:"method"`
	Active    bool      `json:"active"`
	CreatedAt time.Time `json:"created_at"`
}
