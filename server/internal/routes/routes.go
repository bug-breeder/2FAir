package routes

import (
	"os"

	"github.com/bug-breeder/2fair/server/configs"
	"github.com/bug-breeder/2fair/server/internal/interface/controller"
	"github.com/bug-breeder/2fair/server/internal/interface/middleware"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/google"
	"github.com/markbates/goth/providers/microsoftonline"
)

func SetupRoutes(router *gin.Engine, authController *controller.AuthController, otpController *controller.OTPController) {
	// Ensure SESSION_SECRET is set
	gothic.Store = sessions.NewCookieStore([]byte(configs.GetEnv("SESSION_SECRET")))

	redirectURI := os.Getenv("REDIRECT_URI")

	goth.UseProviders(
		google.New(configs.GetEnv("GOOGLE_CLIENT_ID"), configs.GetEnv("GOOGLE_CLIENT_SECRET"), redirectURI+"/auth/google/callback"),
		microsoftonline.New(configs.GetEnv("MICROSOFT_CLIENT_ID"), configs.GetEnv("MICROSOFT_CLIENT_SECRET"), redirectURI+"/auth/microsoft/callback"),
		// apple.New(configs.GetEnv("APPLE_CLIENT_ID"), configs.GetEnv("APPLE_CLIENT_SECRET"), "http://localhost:8080/auth/apple/callback"),
	)

	router.GET("/auth/:provider", authController.AuthHandler)
	router.GET("/auth/:provider/callback", authController.AuthCallback)
	router.POST("/auth/refresh", authController.RefreshToken)
	router.DELETE("/auth/refresh", authController.Logout)

	protected := router.Group("/")
	protected.Use(middleware.Authenticate())
	protected.POST("/otps", otpController.AddOTP)
	protected.PUT("/otps/:otpID/inactivate", otpController.InactivateOTP)
	protected.PUT("/otps/:otpID", otpController.EditOTP)
	protected.GET("/otps", otpController.ListOTPs)
	protected.GET("/otps/codes", otpController.GenerateOTPCodes)
	protected.GET("/login-history", authController.GetLoginHistory)
}
