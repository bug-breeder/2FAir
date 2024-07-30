package routes

import (
	"github.com/bug-breeder/2fair/server/internal/interface/controller"
	"github.com/bug-breeder/2fair/server/internal/interface/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, authController *controller.AuthController, otpController *controller.OTPController) {
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
