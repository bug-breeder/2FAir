package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type LoginEvent struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	Timestamp time.Time          `bson:"timestamp"`
	IPAddress string             `bson:"ip_address"`
	UserAgent string             `bson:"user_agent"`
}
