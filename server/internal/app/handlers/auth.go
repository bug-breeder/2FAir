package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/bug-breeder/2fair/server/configs"
	database "github.com/bug-breeder/2fair/server/internal/pkg/db"

	"github.com/gin-gonic/gin"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/google"
	"github.com/markbates/goth/providers/microsoftonline"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func SetupRoutes(router *gin.Engine) {
	goth.UseProviders(
		google.New(configs.GetEnv("GOOGLE_CLIENT_ID"), configs.GetEnv("GOOGLE_CLIENT_SECRET"), "http://localhost:8080/auth/google/callback"),
		microsoftonline.New(configs.GetEnv("MICROSOFT_CLIENT_ID"), configs.GetEnv("MICROSOFT_CLIENT_SECRET"), "http://localhost:8080/auth/microsoft/callback"),
		// apple.New(configs.GetEnv("APPLE_CLIENT_ID"), configs.GetEnv("APPLE_CLIENT_SECRET"), "http://localhost:8080/auth/apple/callback"),
	)

	router.GET("/auth/:provider", authHandler)
	router.GET("/auth/:provider/callback", authCallback)
}

func authHandler(c *gin.Context) {
	provider := c.Param("provider")
	if provider == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Provider is required"})
		return
	}

	c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), "provider", provider))
	gothic.BeginAuthHandler(c.Writer, c.Request)
}

func authCallback(c *gin.Context) {
	user, err := gothic.CompleteUserAuth(c.Writer, c.Request)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, "/")
		return
	}

	// Store user information in MongoDB
	usersCollection := database.GetCollection("users")

	filter := bson.M{"provider_id": user.UserID, "provider": user.Provider}
	update := bson.M{
		"$set": bson.M{
			"name":        user.Name,
			"email":       user.Email,
			"provider":    user.Provider,
			"provider_id": user.UserID,
			"created_at":  time.Now(),
		},
	}
	opts := options.Update().SetUpsert(true)

	_, err = usersCollection.UpdateOne(context.Background(), filter, update, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store user information"})
		return
	}

	c.JSON(http.StatusOK, user)
}
