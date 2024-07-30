package db

import (
	"context"
	"log"
	"sync"

	"github.com/bug-breeder/2fair/server/configs"
	"github.com/bug-breeder/2fair/server/internal/domain/models"
	"github.com/bug-breeder/2fair/server/internal/domain/repository"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	clientInstance *mongo.Client
	clientOnce     sync.Once
)

type MongoUserRepository struct {
	client *mongo.Client
}

func NewMongoUserRepository(client *mongo.Client) repository.UserRepository {
	return &MongoUserRepository{client: client}
}

func (repo *MongoUserRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*models.User, error) {
	collection := repo.client.Database("myapp").Collection("users")
	var user models.User
	err := collection.FindOne(ctx, bson.M{"_id": id}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (repo *MongoUserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	collection := repo.client.Database("myapp").Collection("users")
	var user models.User
	err := collection.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (repo *MongoUserRepository) CreateUser(ctx context.Context, user *models.User) (primitive.ObjectID, error) {
	collection := repo.client.Database("myapp").Collection("users")
	result, err := collection.InsertOne(ctx, user)
	if err != nil {
		return primitive.NilObjectID, err
	}
	return result.InsertedID.(primitive.ObjectID), nil
}

func (repo *MongoUserRepository) UpdateLoginHistory(ctx context.Context, userID primitive.ObjectID, loginEvent models.LoginEvent) error {
	collection := repo.client.Database("myapp").Collection("users")
	_, err := collection.UpdateOne(ctx, bson.M{"_id": userID}, bson.M{"$push": bson.M{"login_history": loginEvent}})
	return err
}

func (repo *MongoUserRepository) RemoveLoginEvent(ctx context.Context, userID primitive.ObjectID, token string) error {
	collection := repo.client.Database("myapp").Collection("users")
	_, err := collection.UpdateOne(ctx, bson.M{"_id": userID}, bson.M{"$pull": bson.M{"login_history": bson.M{"refresh_token": token}}})
	return err
}

func GetMongoClient() *mongo.Client {
	clientOnce.Do(func() {
		clientOptions := options.Client().ApplyURI(configs.GetEnv("MONGO_URI"))
		client, err := mongo.Connect(context.Background(), clientOptions)
		if err != nil {
			log.Fatal(err)
		}

		err = client.Ping(context.Background(), nil)
		if err != nil {
			log.Fatal(err)
		}

		clientInstance = client
	})
	return clientInstance
}
