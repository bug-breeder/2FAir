package models

import (
	"time"
)

type LoginEvent struct {
	RefreshToken string    `bson:"refresh_token"`
	Timestamp    time.Time `bson:"timestamp"`
	IPAddress    string    `bson:"ip_address"`
	UserAgent    string    `bson:"user_agent"`
}
