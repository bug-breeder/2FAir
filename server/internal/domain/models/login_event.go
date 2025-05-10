package models

import (
	"time"
)

type LoginEvent struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Timestamp time.Time `json:"timestamp"`
	IPAddress string    `json:"ip_address"`
	UserAgent string    `json:"user_agent"`
}
