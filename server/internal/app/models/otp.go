package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type OTP struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	UserID    primitive.ObjectID `bson:"user_id"`
	IssuerID  primitive.ObjectID `bson:"issuer_id"`
	Label     string             `bson:"label"`
	Secret    string             `bson:"secret"`
	Algorithm string             `bson:"algorithm"`
	Digits    int                `bson:"digits"`
	Period    int                `bson:"period"`
	Counter   int                `bson:"counter"`
	Method    string             `bson:"method"`
	CreatedAt time.Time          `bson:"created_at"`
}
