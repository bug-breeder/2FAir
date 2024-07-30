package routes

import (
	"github.com/bug-breeder/2fair/internal/interface/controller"
	"github.com/bug-breeder/2fair/internal/interface/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, authController *controller.AuthController) {
	router.GET("/auth/:provider", authController.AuthHandler)
	router.GET("/auth/:provider/callback", authController.AuthCallback)
	router.POST("/auth/refresh", authController.RefreshToken)
	router.DELETE("/auth/refresh", authController.Logout)

	protected := router.Group("/")
	protected.Use(middleware.Authenticate())
	protected.POST("/otps", authController.AddOTP)
	protected.PUT("/otps/:otpID/inactivate", authController.InactivateOTP)
	protected.PUT("/otps/:otpID", authController.EditOTP)
	protected.GET("/otps", authController.ListOTPs)
	protected.GET("/otps/codes", authController.GenerateOTPCodes)
	protected.GET("/login-history", authController.GetLoginHistory)
}
