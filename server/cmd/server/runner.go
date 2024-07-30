package main

import (
	"log"

	_ "github.com/bug-breeder/2fair/server/docs" // This is important for the Swagger docs to be generated
	"github.com/bug-breeder/2fair/server/internal/infrastructure/db"
	"github.com/bug-breeder/2fair/server/internal/interface/controller"
	"github.com/bug-breeder/2fair/server/internal/routes"
	"github.com/bug-breeder/2fair/server/internal/usecase"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func Run() {
	// Setup router
	router := gin.Default()
	// CORS configuration
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"https://2fair.vip"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Setup database connection
	client := db.GetMongoClient()
	userRepo := db.NewMongoUserRepository(client)
	otpRepo := db.NewMongoOTPRepository(client)

	// Setup use cases
	authUseCase := usecase.NewAuthUseCase(userRepo)
	otpUseCase := usecase.NewOTPUseCase(otpRepo)

	// Setup controllers
	authController := controller.NewAuthController(authUseCase)
	otpController := controller.NewOTPController(otpUseCase)

	// Setup routes
	routes.SetupRoutes(router, authController, otpController)

	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	if err := router.Run(); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
