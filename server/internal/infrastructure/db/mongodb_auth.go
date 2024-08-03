package db

import (
	"context"
	"github.com/bug-breeder/2fair/server/internal/domain/models"
	"github.com/bug-breeder/2fair/server/internal/domain/repository"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type MongoUserRepository struct {
	collection *mongo.Collection
}

func NewMongoUserRepository(client *mongo.Client, database, collection string) repository.UserRepository {
	return &MongoUserRepository{
		collection: client.Database(database).Collection(collection),
	}
}

func (repo *MongoUserRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*models.User, error) {
	var user models.User
	err := repo.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (repo *MongoUserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := repo.collection.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (repo *MongoUserRepository) CreateUser(ctx context.Context, user *models.User) (primitive.ObjectID, error) {
	result, err := repo.collection.InsertOne(ctx, user)
	if err != nil {
		return primitive.NilObjectID, err
	}
	return result.InsertedID.(primitive.ObjectID), nil
}

func (repo *MongoUserRepository) UpdateLoginHistory(ctx context.Context, userID primitive.ObjectID, loginEvent models.LoginEvent) error {
	_, err := repo.collection.UpdateOne(ctx, bson.M{"_id": userID}, bson.M{"$push": bson.M{"login_history": loginEvent}})
	return err
}

func (repo *MongoUserRepository) RemoveLoginEvent(ctx context.Context, userID primitive.ObjectID, sessionID primitive.ObjectID) error {
	_, err := repo.collection.UpdateOne(ctx, bson.M{"_id": userID}, bson.M{"$pull": bson.M{"login_history": bson.M{"_id": sessionID}}})
	return err
}

// FindLoginEventByID checks if the login event exists in the user's login history
func (repo *MongoUserRepository) FindLoginEventByID(ctx context.Context, userID primitive.ObjectID, sessionID primitive.ObjectID) error {
	var user models.User
	err := repo.collection.FindOne(ctx, bson.M{"_id": userID, "login_history._id": sessionID}).Decode(&user)
	if err != nil {
		return err
	}
	return nil
}
