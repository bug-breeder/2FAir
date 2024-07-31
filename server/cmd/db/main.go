package main

import (
	"context"

	"github.com/bug-breeder/2fair/server/configs"
	"github.com/bug-breeder/2fair/server/internal/infrastructure/db"

	_ "github.com/bug-breeder/2fair/server/docs" // This is important for the Swagger docs to be generated
)

func main() {
	ctx := context.TODO()

	configs.LoadEnv()
	createIndexes(ctx, db.GetMongoClient())
}
