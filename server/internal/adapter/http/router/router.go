package routes

import (
	"os"

	"github.com/bug-breeder/2fair/server/internal/adapter/http/controller"
	"github.com/bug-breeder/2fair/server/internal/adapter/http/middleware"
	"github.com/bug-breeder/2fair/server/internal/infrastructure/configs"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/google"
	"github.com/markbates/goth/providers/microsoftonline"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func SetupRoutes(router *gin.Engine, authController *controller.AuthController, otpController *controller.OTPController) {
	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Ensure SESSION_SECRET is set
	gothic.Store = sessions.NewCookieStore([]byte(configs.GetEnv("SESSION_SECRET")))

	redirectURI := os.Getenv("REDIRECT_URI")

	goth.UseProviders(
		google.New(configs.GetEnv("GOOGLE_CLIENT_ID"), configs.GetEnv("GOOGLE_CLIENT_SECRET"), redirectURI+"/api/v1/auth/google/callback"),
		microsoftonline.New(configs.GetEnv("MICROSOFT_CLIENT_ID"), configs.GetEnv("MICROSOFT_CLIENT_SECRET"), redirectURI+"/api/v1/auth/microsoft/callback"),
		// apple.New(configs.GetEnv("APPLE_CLIENT_ID"), configs.GetEnv("APPLE_CLIENT_SECRET"), "http://localhost:8080/api/v1/auth/apple/callback"),
	)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Auth routes
		v1.GET("/auth/:provider", authController.GoogleLogin)
		v1.GET("/auth/:provider/callback", authController.GoogleCallback)
		v1.POST("/auth/refresh", authController.RefreshToken)
		v1.DELETE("/auth/refresh", authController.Logout)

		// Protected routes
		protected := v1.Group("/")
		protected.Use(middleware.Authenticate())
		{
			// OTP routes
			protected.POST("/otp", otpController.AddOTP)
			protected.PUT("/otp/:id/inactivate", otpController.InactivateOTP)
			protected.PUT("/otp/:id", otpController.EditOTP)
			protected.GET("/otp", otpController.ListOTPs)
			protected.GET("/otp/codes", otpController.GenerateOTPCodes)

			// User routes
			protected.GET("/login-history", authController.GetLoginHistory)
		}
	}
}
