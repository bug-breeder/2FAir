package handlers

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/bug-breeder/2fair/server/configs"
	"github.com/bug-breeder/2fair/server/internal/app/models"
	"github.com/bug-breeder/2fair/server/internal/pkg/auth"
	"github.com/bug-breeder/2fair/server/internal/pkg/db"
	"github.com/gorilla/sessions"

	"github.com/bug-breeder/2fair/server/internal/app/dtos"
	"github.com/gin-gonic/gin"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/google"
	"github.com/markbates/goth/providers/microsoftonline"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func SetupRoutes(router *gin.Engine) {
	// Ensure SESSION_SECRET is set
	gothic.Store = sessions.NewCookieStore([]byte(configs.GetEnv("SESSION_SECRET")))

	redirectURI := os.Getenv("REDIRECT_URI")

	goth.UseProviders(
		google.New(configs.GetEnv("GOOGLE_CLIENT_ID"), configs.GetEnv("GOOGLE_CLIENT_SECRET"), redirectURI+"/auth/google/callback"),
		microsoftonline.New(configs.GetEnv("MICROSOFT_CLIENT_ID"), configs.GetEnv("MICROSOFT_CLIENT_SECRET"), redirectURI+"/auth/microsoft/callback"),
		// apple.New(configs.GetEnv("APPLE_CLIENT_ID"), configs.GetEnv("APPLE_CLIENT_SECRET"), "http://localhost:8080/auth/apple/callback"),
	)

	router.GET("/auth/:provider", authHandler)
	router.GET("/auth/:provider/callback", authCallback)
	router.POST("/auth/refresh", RefreshToken)
	router.DELETE("/auth/refresh", Logout)

	protected := router.Group("/")
	protected.Use(auth.Authenticate())
	protected.POST("/otps", AddOTP)
	protected.PUT("/otps/:otpID/inactivate", InactivateOTP)
	protected.PUT("/otps/:otpID", EditOTP)
	protected.GET("/otps", ListOTPs)
	protected.GET("/otps/codes", GenerateOTPCodes)
	protected.GET("/login-history", GetLoginHistory)
}

// authHandler godoc
// @Summary Start authentication process
// @Description Start the authentication process with the specified provider
// @Tags auth
// @Accept json
// @Produce json
// @Param provider path string true "Provider"
// @Success 200 {object} dtos.MessageResponse
// @Failure 400 {object} dtos.ErrorResponse
// @Router /auth/{provider} [get]
func authHandler(c *gin.Context) {
	provider := c.Param("provider")
	if provider == "" {
		c.JSON(http.StatusBadRequest, dtos.ErrorResponse{Error: "Provider is required"})
		return
	}

	c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), "provider", provider))
	gothic.BeginAuthHandler(c.Writer, c.Request)
}

// authCallback godoc
// @Summary Authentication callback
// @Description Handle the callback from the authentication provider
// @Tags auth
// @Accept json
// @Produce json
// @Success 200 {object} dtos.MessageResponse
// @Failure 500 {object} dtos.ErrorResponse
// @Router /auth/{provider}/callback [get]
func authCallback(c *gin.Context) {
	user, err := gothic.CompleteUserAuth(c.Writer, c.Request)
	if err != nil {
		log.Printf("Failed to complete user auth: %v", err)
		c.JSON(http.StatusInternalServerError, dtos.ErrorResponse{Error: "Failed to complete user auth"})
		return
	}

	// Store user information in MongoDB
	usersCollection := db.GetCollection("users")

	// Check if a user with the same email already exists
	existingUser := models.User{}
	err = usersCollection.FindOne(context.Background(), bson.M{"email": user.Email}).Decode(&existingUser)
	if err != nil && err != mongo.ErrNoDocuments {
		log.Printf("Failed to check existing user: %v", err)
		c.JSON(http.StatusInternalServerError, dtos.ErrorResponse{Error: "Failed to check existing user"})
		return
	}

	var (
		accessToken, refreshToken string
		userID                    primitive.ObjectID
	)

	if err == mongo.ErrNoDocuments {
		// No existing user found, create a new one
		newUser := models.User{
			Name:         user.Name,
			Email:        user.Email,
			Provider:     user.Provider,
			ProviderID:   user.UserID,
			CreatedAt:    time.Now(),
			OTPs:         []models.OTP{},
			LoginHistory: []models.LoginEvent{},
		}

		result, err := usersCollection.InsertOne(context.Background(), newUser)
		if err != nil {
			log.Printf("Failed to create new user: %v", err)
			c.JSON(http.StatusInternalServerError, dtos.ErrorResponse{Error: "Failed to create new user"})
			return
		}

		userID = result.InsertedID.(primitive.ObjectID)
		accessToken, err = auth.GenerateAccessToken(userID.Hex(), newUser.Email)
		if err != nil {
			log.Printf("Failed to generate access token: %v", err)
			c.JSON(http.StatusInternalServerError, dtos.ErrorResponse{Error: "Failed to generate access token"})
			return
		}

		refreshToken, err = auth.GenerateRefreshToken(userID.Hex(), newUser.Email)
		if err != nil {
			log.Printf("Failed to generate refresh token: %v", err)
			c.JSON(http.StatusInternalServerError, dtos.ErrorResponse{Error: "Failed to generate refresh token"})
			return
		}

	} else {
		// Existing user found, return the user info without updating
		userID = existingUser.ID
		accessToken, err = auth.GenerateAccessToken(userID.Hex(), existingUser.Email)
		if err != nil {
			log.Printf("Failed to generate access token: %v", err)
			c.JSON(http.StatusInternalServerError, dtos.ErrorResponse{Error: "Failed to generate access token"})
			return
		}

		refreshToken, err = auth.GenerateRefreshToken(userID.Hex(), existingUser.Email)
		if err != nil {
			log.Printf("Failed to generate refresh token: %v", err)
			c.JSON(http.StatusInternalServerError, dtos.ErrorResponse{Error: "Failed to generate refresh token"})
			return
		}
	}

	// Log the login event
	loginEvent := models.LoginEvent{
		Timestamp:    time.Now(),
		IPAddress:    c.ClientIP(),
		UserAgent:    c.Request.UserAgent(),
		RefreshToken: refreshToken,
	}

	filter := bson.M{"_id": userID}
	update := bson.M{"$push": bson.M{"login_history": loginEvent}}
	updateResult, err := usersCollection.UpdateOne(
		context.Background(),
		filter,
		update,
	)
	if err != nil {
		log.Printf("Failed to log login event: %v", err)
	} else {
		log.Printf("Login event logged: %+v, result: %+v", loginEvent, updateResult)
		log.Printf("User event: %+v", existingUser.LoginHistory)
	}

	// Set tokens in cookies
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/auth/refresh",
		HttpOnly: true,
		Secure:   true,
	})

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
	})

	c.JSON(http.StatusOK, dtos.MessageResponse{Message: "Authentication successful"})
}

// RefreshToken godoc
// @Summary Refresh access token
// @Description Refresh the access token using the refresh token cookie
// @Tags auth
// @Accept json
// @Produce json
// @Success 200 {object} dtos.MessageResponse
// @Failure 401 {object} dtos.ErrorResponse
// @Failure 500 {object} dtos.ErrorResponse
// @Router /auth/refresh [post]
func RefreshToken(c *gin.Context) {
	refreshTokenCookie, err := c.Request.Cookie("refresh_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, dtos.ErrorResponse{Error: "Refresh token is missing"})
		return
	}

	refreshToken := refreshTokenCookie.Value
	claims, err := auth.ValidateToken(refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dtos.ErrorResponse{Error: "Invalid refresh token"})
		return
	}

	usersCollection := db.GetCollection("users")
	userID := claims.UserID
	userObjectID, _ := primitive.ObjectIDFromHex(userID)

	// Check if the refresh token exists in the login history
	var user models.User
	err = usersCollection.FindOne(context.Background(), bson.M{"_id": userObjectID, "login_history.refresh_token": refreshToken}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusUnauthorized, dtos.ErrorResponse{Error: "Invalid refresh token"})
			return
		}
		c.JSON(http.StatusInternalServerError, dtos.ErrorResponse{Error: "Failed to validate refresh token"})
		return
	}

	accessToken, err := auth.GenerateAccessToken(userID, claims.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dtos.ErrorResponse{Error: "Failed to generate access token"})
		return
	}

	newRefreshToken, err := auth.GenerateRefreshToken(userID, claims.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dtos.ErrorResponse{Error: "Failed to generate refresh token"})
		return
	}

	// Update the login event with the new refresh token
	_, err = usersCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": userObjectID, "login_history.refresh_token": refreshToken},
		bson.M{"$set": bson.M{"login_history.$.refresh_token": newRefreshToken}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dtos.ErrorResponse{Error: "Failed to update refresh token"})
		return
	}

	// Set tokens in cookies
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "refresh_token",
		Value:    newRefreshToken,
		Path:     "/auth/refresh",
		HttpOnly: true,
		Secure:   true,
	})

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
	})

	c.JSON(http.StatusOK, dtos.MessageResponse{Message: "Access token refreshed"})
}

// Logout godoc
// @Summary Logout
// @Description Clear the authentication cookies
// @Tags auth
// @Accept json
// @Produce json
// @Success 200 {object} dtos.MessageResponse
// @Router /auth/logout [post]
func Logout(c *gin.Context) {
	refreshTokenCookie, err := c.Request.Cookie("refresh_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, dtos.ErrorResponse{Error: "Refresh token is missing"})
		return
	}

	refreshToken := refreshTokenCookie.Value
	claims, err := auth.ValidateToken(refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dtos.ErrorResponse{Error: "Invalid refresh token"})
		return
	}

	usersCollection := db.GetCollection("users")
	userID := claims.UserID
	userObjectID, _ := primitive.ObjectIDFromHex(userID)

	// Remove the login event with the refresh token
	_, err = usersCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": userObjectID},
		bson.M{"$pull": bson.M{"login_history": bson.M{"refresh_token": refreshToken}}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dtos.ErrorResponse{Error: "Failed to log out"})
		return
	}

	// Clear the cookies
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/auth/refresh",
		HttpOnly: true,
		Secure:   true,
		MaxAge:   -1,
	})

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		MaxAge:   -1,
	})

	c.JSON(http.StatusOK, dtos.MessageResponse{Message: "Successfully logged out"})
}

// GetLoginHistory godoc
// @Summary Get login history
// @Description Get the login history for the authenticated user
// @Tags auth
// @Accept json
// @Produce json
// @Success 200 {array} models.LoginEvent
// @Failure 401 {object} dtos.ErrorResponse
// @Failure 500 {object} dtos.ErrorResponse
// @Router /login-history [get]
func GetLoginHistory(c *gin.Context) {
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
		c.JSON(http.StatusInternalServerError, dtos.ErrorResponse{Error: "Failed to fetch login history"})
		return
	}

	c.JSON(http.StatusOK, user.LoginHistory)
}
