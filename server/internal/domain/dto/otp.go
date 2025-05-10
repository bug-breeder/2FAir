package dto

import (
	"time"
)

type ListOTPsResponse struct {
	ID        int    `json:"Id"`
	Issuer    string `json:"Issuer"`
	Label     string `json:"Label"`
	Algorithm string `json:"Algorithm"`
	Digits    int    `json:"Digits"`
	Period    int    `json:"Period"`
	Counter   int    `json:"Counter"`
	Method    string `json:"Method"`
}

type GenerateOTPCodesResponse struct {
	ID              int       `json:"Id"`
	CurrentCode     string    `json:"CurrentCode"`
	CurrentExpireAt time.Time `json:"CurrentExpireAt"`
	NextCode        string    `json:"NextCode"`
	NextExpireAt    time.Time `json:"NextExpireAt"`
}
