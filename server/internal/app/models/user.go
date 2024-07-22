package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID         primitive.ObjectID `bson:"_id,omitempty"`
	Name       string             `bson:"name"`
	Email      string             `bson:"email"`
	Provider   string             `bson:"provider"`
	ProviderID string             `bson:"provider_id"`
	CreatedAt  time.Time          `bson:"created_at"`
}
