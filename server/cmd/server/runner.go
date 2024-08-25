package main

import (
	"log"

	"github.com/bug-breeder/2fair/server/configs"

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

func runServer() {
	// Setup router
	router := gin.Default()
	// CORS configuration
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"https://2fair.vip", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Setup database connection
	client := db.GetMongoClient()
	userRepo := db.NewMongoUserRepository(client, configs.GetEnv("DATABASE_NAME"), "users")
	otpRepo := db.NewMongoOTPRepository(client, configs.GetEnv("DATABASE_NAME"), "users")

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
