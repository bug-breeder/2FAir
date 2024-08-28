package dto

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ListOTPsResponse struct {
	ID        primitive.ObjectID `json:"Id"`
	Issuer    string             `bson:"Issuer"`
	Label     string             `json:"Label"`
	Algorithm string             `json:"Algorithm"`
	Digits    int                `json:"Digits"`
	Period    int                `json:"Period"`
	Counter   int                `json:"Counter"`
	Method    string             `json:"Method"`
}

type GenerateOTPCodesResponse struct {
	ID              primitive.ObjectID `json:"Id"`
	CurrentCode     string             `json:"CurrentCode"`
	CurrentExpireAt time.Time          `json:"CurrentExpireAt"`
	NextCode        string             `json:"NextCode"`
	NextExpireAt    time.Time          `json:"NextExpireAt"`
}
