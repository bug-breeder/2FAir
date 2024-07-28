package handlers

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/bug-breeder/2fair/server/internal/app/dtos"
	"github.com/bug-breeder/2fair/server/internal/app/models"
	"github.com/bug-breeder/2fair/server/internal/pkg/db"
	"github.com/gin-gonic/gin"
	"github.com/pquerna/otp/totp"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// AddOTP godoc
// @Summary Add a new OTP
// @Description Add a new OTP for the user
// @Tags otps
// @Accept json
// @Produce json
// @Param otp body models.OTP true "OTP"
// @Success 200 {object} models.OTP
// @Failure 400 {object} dtos.ErrorResponse
// @Failure 500 {object} dtos.ErrorResponse
// @Router /otps [post]
func AddOTP(c *gin.Context) {
	userID := c.MustGet("userID").(string)
	var otp models.OTP
	if err := c.ShouldBindJSON(&otp); err != nil {
		c.JSON(http.StatusBadRequest, dtos.ErrorResponse{Error: err.Error()})
		return
	}

	otp.ID = primitive.NewObjectID()
	otp.CreatedAt = time.Now()
	otp.Active = true

	usersCollection := db.GetCollection("users")

	userObjectID, _ := primitive.ObjectIDFromHex(userID)
	filter := bson.M{"_id": userObjectID}
	update := bson.M{"$push": bson.M{"otps": otp}}

	_, err := usersCollection.UpdateOne(context.Background(), filter, update)
	if err != nil {
		log.Printf("Failed to add OTP: %v", err)
		c.JSON(http.StatusInternalServerError, dtos.ErrorResponse{Error: "Failed to add OTP"})
		return
	}

	c.JSON(http.StatusOK, otp)
}

// InactivateOTP godoc
// @Summary Inactivate an OTP
// @Description Inactivate an OTP for the user
// @Tags otps
// @Accept json
// @Produce json
// @Param otpID path string true "OTP ID"
// @Success 200 {object} dtos.MessageResponse
// @Failure 500 {object} dtos.ErrorResponse
// @Router /otps/{otpID}/inactivate [put]
func InactivateOTP(c *gin.Context) {
	userID := c.MustGet("userID").(string)
	otpID := c.Param("otpID")

	usersCollection := db.GetCollection("users")

	userObjectID, _ := primitive.ObjectIDFromHex(userID)
	otpObjectID, _ := primitive.ObjectIDFromHex(otpID)
	userFilter := bson.M{"_id": userObjectID, "otps._id": otpObjectID}
	otpUpdate := bson.M{"$set": bson.M{"otps.$.active": false}}

	_, err := usersCollection.UpdateOne(context.Background(), userFilter, otpUpdate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dtos.ErrorResponse{Error: "Failed to inactivate OTP"})
		return
	}

	c.JSON(http.StatusOK, dtos.MessageResponse{Message: "OTP inactivated"})
}

// EditOTP godoc
// @Summary Edit an OTP
// @Description Edit an existing OTP for the user
// @Tags otps
// @Accept json
// @Produce json
// @Param otpID path string true "OTP ID"
// @Param otp body models.OTP true "OTP"
// @Success 200 {object} dtos.MessageResponse
// @Failure 400 {object} dtos.ErrorResponse
// @Failure 500 {object} dtos.ErrorResponse
// @Router /otps/{otpID} [put]
func EditOTP(c *gin.Context) {
	userID := c.MustGet("userID").(string)
	otpID := c.Param("otpID")
	var updatedOTP models.OTP
	if err := c.ShouldBindJSON(&updatedOTP); err != nil {
		c.JSON(http.StatusBadRequest, dtos.ErrorResponse{Error: err.Error()})
		return
	}

	usersCollection := db.GetCollection("users")

	userObjectID, _ := primitive.ObjectIDFromHex(userID)
	otpObjectID, _ := primitive.ObjectIDFromHex(otpID)
	userFilter := bson.M{"_id": userObjectID, "otps._id": otpObjectID}
	otpUpdate := bson.M{
		"$set": bson.M{
			"otps.$.label":     updatedOTP.Label,
			"otps.$.secret":    updatedOTP.Secret,
			"otps.$.algorithm": updatedOTP.Algorithm,
			"otps.$.digits":    updatedOTP.Digits,
			"otps.$.period":    updatedOTP.Period,
			"otps.$.counter":   updatedOTP.Counter,
			"otps.$.method":    updatedOTP.Method,
		},
	}

	_, err := usersCollection.UpdateOne(context.Background(), userFilter, otpUpdate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dtos.ErrorResponse{Error: "Failed to edit OTP"})
		return
	}

	c.JSON(http.StatusOK, dtos.MessageResponse{Message: "OTP updated"})
}

// ListOTPs godoc
// @Summary List OTPs
// @Description List all OTPs for the user excluding the secret
// @Tags otps
// @Accept json
// @Produce json
// @Success 200 {array} dtos.ListOTPsResponse
// @Failure 401 {object} dtos.ErrorResponse
// @Failure 404 {object} dtos.ErrorResponse
// @Failure 500 {object} dtos.ErrorResponse
// @Router /otps [get]
func ListOTPs(c *gin.Context) {
	userID := c.MustGet("userID").(string)

	usersCollection := db.GetCollection("users")

	userObjectID, _ := primitive.ObjectIDFromHex(userID)
	var user models.User
	err := usersCollection.FindOne(context.Background(), bson.M{"_id": userObjectID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, dtos.ErrorResponse{Error: "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, dtos.ErrorResponse{Error: "Failed to fetch OTPs"})
		return
	}
	// Filter out inactive OTPs
	var activeOTPs []models.OTP
	for _, otp := range user.OTPs {
		if otp.Active {
			activeOTPs = append(activeOTPs, otp)
		}
	}
	user.OTPs = activeOTPs

	// Remove the secret field from the OTPs before returning
	var otpsResponse []dtos.ListOTPsResponse
	for _, otp := range user.OTPs {
		otpsResponse = append(otpsResponse, dtos.ListOTPsResponse{
			ID:        otp.ID,
			Label:     otp.Label,
			Algorithm: otp.Algorithm,
			Digits:    otp.Digits,
			Period:    otp.Period,
			Counter:   otp.Counter,
			Method:    otp.Method,
		})
	}

	c.JSON(http.StatusOK, otpsResponse)
}

// GenerateOTPCodes godoc
// @Summary Generate OTP codes
// @Description Generate current and next OTP codes for the user
// @Tags otps
// @Accept json
// @Produce json
// @Success 200 {array} dtos.GenerateOTPCodesResponse
// @Failure 401 {object} dtos.ErrorResponse
// @Failure 404 {object} dtos.ErrorResponse
// @Failure 500 {object} dtos.ErrorResponse
// @Router /otps/codes [get]
func GenerateOTPCodes(c *gin.Context) {
	userID := c.MustGet("userID").(string)

	usersCollection := db.GetCollection("users")

	userObjectID, _ := primitive.ObjectIDFromHex(userID)
	var user models.User
	err := usersCollection.FindOne(context.Background(), bson.M{"_id": userObjectID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, dtos.ErrorResponse{Error: "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, dtos.ErrorResponse{Error: "Failed to fetch OTPs"})
		return
	}

	// Filter out inactive OTPs
	var activeOTPs []models.OTP
	for _, otp := range user.OTPs {
		if otp.Active {
			activeOTPs = append(activeOTPs, otp)
		}
	}
	user.OTPs = activeOTPs

	codes := make([]dtos.GenerateOTPCodesResponse, len(user.OTPs))

	for i, otp := range user.OTPs {
		now := time.Now()
		periodDuration := time.Duration(otp.Period) * time.Second

		// Calculate the expiration time for the current code
		currentExpireAt := now.Truncate(periodDuration).Add(periodDuration)

		currentCode, err := totp.GenerateCode(otp.Secret, time.Now())
		if err != nil {
			c.JSON(http.StatusInternalServerError, dtos.ErrorResponse{Error: "Failed to generate current OTP code"})
			return
		}

		nextExpireAt := currentExpireAt.Add(periodDuration)
		nextTime := time.Now().Add(time.Duration(otp.Period) * time.Second)
		nextCode, err := totp.GenerateCode(otp.Secret, nextTime)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dtos.ErrorResponse{Error: "Failed to generate next OTP code"})
			return
		}

		codes[i] = dtos.GenerateOTPCodesResponse{
			ID:              otp.ID,
			CurrentCode:     currentCode,
			NextCode:        nextCode,
			CurrentExpireAt: currentExpireAt,
			NextExpireAt:    nextExpireAt,
		}
	}

	c.JSON(http.StatusOK, codes)
}
