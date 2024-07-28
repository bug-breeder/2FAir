package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Issuer struct {
	ID             primitive.ObjectID `bson:"_id,omitempty"`
	Name           string             `bson:"name"`
	Website        string             `bson:"website"`
	HelpURL        string             `bson:"help_url"`
	ImageURI       string             `bson:"image_uri"`
	Digits         int                `bson:"digits"`
	Period         int                `bson:"period"`
	DefaultCounter int                `bson:"default_counter"`
	Algorithm      string             `bson:"algorithm"`
	Method         string             `bson:"method"`
}
