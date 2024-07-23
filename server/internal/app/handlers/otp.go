package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/bug-breeder/2fair/server/internal/app/models"
	"github.com/bug-breeder/2fair/server/internal/pkg/db"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func AddOTP(c *gin.Context) {
	userID := c.MustGet("userID").(string)
	var otp models.OTP
	if err := c.ShouldBindJSON(&otp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add OTP"})
		return
	}

	c.JSON(http.StatusOK, otp)
}

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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to inactivate OTP"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "OTP inactivated"})
}

func EditOTP(c *gin.Context) {
	userID := c.MustGet("userID").(string)
	otpID := c.Param("otpID")
	var updatedOTP models.OTP
	if err := c.ShouldBindJSON(&updatedOTP); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to edit OTP"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "OTP updated"})
}

func ListOTPs(c *gin.Context) {
	userID := c.MustGet("userID").(string)

	usersCollection := db.GetCollection("users")

	userObjectID, _ := primitive.ObjectIDFromHex(userID)
	var user models.User
	err := usersCollection.FindOne(context.Background(), bson.M{"_id": userObjectID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch OTPs"})
		return
	}

	c.JSON(http.StatusOK, user.OTPs)
}
