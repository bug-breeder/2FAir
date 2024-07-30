package dto

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ListOTPsResponse struct {
	ID        primitive.ObjectID `json:"id"`
	Label     string             `json:"label"`
	Algorithm string             `json:"algorithm"`
	Digits    int                `json:"digits"`
	Period    int                `json:"period"`
	Counter   int                `json:"counter"`
	Method    string             `json:"method"`
}

type GenerateOTPCodesResponse struct {
	ID              primitive.ObjectID `json:"id"`
	CurrentCode     string             `json:"current_code"`
	CurrentExpireAt time.Time          `json:"current_expire_at"`
	NextCode        string             `json:"next_code"`
	NextExpireAt    time.Time          `json:"next_expire_at"`
}
