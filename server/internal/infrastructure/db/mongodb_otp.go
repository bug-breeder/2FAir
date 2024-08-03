package db

import (
	"context"

	"github.com/bug-breeder/2fair/server/internal/domain/models"
	"github.com/bug-breeder/2fair/server/internal/domain/repository"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type MongoOTPRepository struct {
	collection *mongo.Collection
}

func NewMongoOTPRepository(client *mongo.Client, database, collection string) repository.OTPRepository {
	return &MongoOTPRepository{
		collection: client.Database(database).Collection(collection),
	}
}

func (repo *MongoOTPRepository) AddOTP(ctx context.Context, userID primitive.ObjectID, otp *models.OTP) error {
	filter := bson.M{"_id": userID}
	update := bson.M{"$push": bson.M{"otps": otp}}
	_, err := repo.collection.UpdateOne(ctx, filter, update)
	return err
}

func (repo *MongoOTPRepository) InactivateOTP(ctx context.Context, userID, otpID primitive.ObjectID) error {
	filter := bson.M{"_id": userID, "otps._id": otpID}
	update := bson.M{"$set": bson.M{"otps.$.active": false}}
	_, err := repo.collection.UpdateOne(ctx, filter, update)
	return err
}

func (repo *MongoOTPRepository) EditOTP(ctx context.Context, userID, otpID primitive.ObjectID, otp *models.OTP) error {
	filter := bson.M{"_id": userID, "otps._id": otpID}
	update := bson.M{
		"$set": bson.M{
			"otps.$.label":     otp.Label,
			"otps.$.secret":    otp.Secret,
			"otps.$.algorithm": otp.Algorithm,
			"otps.$.digits":    otp.Digits,
			"otps.$.period":    otp.Period,
			"otps.$.counter":   otp.Counter,
			"otps.$.method":    otp.Method,
		},
	}
	_, err := repo.collection.UpdateOne(ctx, filter, update)
	return err
}

func (repo *MongoOTPRepository) ListOTPs(ctx context.Context, userID primitive.ObjectID) ([]models.OTP, error) {
	var user models.User
	err := repo.collection.FindOne(ctx, bson.M{"_id": userID}).Decode(&user)
	if err != nil {
		return nil, err
	}

	var activeOTPs []models.OTP
	for _, otp := range user.OTPs {
		if otp.Active {
			activeOTPs = append(activeOTPs, otp)
		}
	}
	return activeOTPs, nil
}
