package db

import (
	"context"
	"github.com/bug-breeder/2fair/server/configs"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"log"
	"sync"
)

var (
	clientInstance *mongo.Client
	clientOnce     sync.Once
)

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
