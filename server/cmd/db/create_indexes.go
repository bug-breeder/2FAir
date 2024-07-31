package main

import (
	"context"
	"log"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func createIndexes(ctx context.Context, client *mongo.Client) error {
	usersCollection := client.Database("myapp").Collection("users")

	// Index definitions
	indexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "otps._id", Value: 1}}, // Index on otps._id (multikey index)
			Options: options.Index().SetName("otps_id_index"),
		},
		{
			Keys:    bson.D{{Key: "login_history._id", Value: 1}}, // Index on login_history._id (multikey index)
			Options: options.Index().SetName("login_history_id_index"),
		},
	}

	existingIndexes, err := usersCollection.Indexes().List(ctx)
	if err != nil {
		log.Printf("Failed to list indexes: %v", err)
		return err
	}

	existingIndexNames := make(map[string]struct{})
	for existingIndexes.Next(ctx) {
		var index bson.M
		if err := existingIndexes.Decode(&index); err != nil {
			log.Printf("Failed to decode index: %v", err)
			return err
		}
		if name, ok := index["name"].(string); ok {
			log.Printf("Found existing index: %s", name)
			existingIndexNames[name] = struct{}{}
		}
	}

	var indexesToCreate []mongo.IndexModel
	for _, index := range indexes {
		if _, exists := existingIndexNames[*index.Options.Name]; !exists {
			indexesToCreate = append(indexesToCreate, index)
		}
	}

	if len(indexesToCreate) > 0 {
		_, err := usersCollection.Indexes().CreateMany(ctx, indexesToCreate)
		if err != nil {
			log.Printf("Failed to create indexes: %v", err)
			return err
		}
		log.Println("Indexes created successfully")
	} else {
		log.Println("Indexes already exist")
	}

	return nil
}
