package main

import (
	"log"

	_ "github.com/bug-breeder/2fair/server/docs" // This is important for the Swagger docs to be generated
	"github.com/bug-breeder/2fair/server/internal/adapter/http/controller"
	route "github.com/bug-breeder/2fair/server/internal/adapter/http/router"
	"github.com/bug-breeder/2fair/server/internal/adapter/repository/postgres" // Updated to postgres package
	"github.com/bug-breeder/2fair/server/internal/infrastructure/configs"
	"github.com/bug-breeder/2fair/server/internal/usecase"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func runServer() {
	// Setup router
	router := gin.Default()
	// CORS configuration
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"https://2fair.vip", "http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "https://app.2fair.vip"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Setup database connection
	db, err := postgres.NewPostgresConnection(
		configs.GetEnv("DB_HOST"),
		configs.GetEnv("DB_PORT"),
		configs.GetEnv("DB_USER"),
		configs.GetEnv("DB_PASSWORD"),
		configs.GetEnv("DB_NAME"),
		configs.GetEnv("DB_SSL_MODE"),
	)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Printf("Successfully connected to database at %s:%s", configs.GetEnv("DB_HOST"), configs.GetEnv("DB_PORT"))

	// Setup repositories with PostgreSQL
	userRepo := postgres.NewPostgresUserRepository(db)
	otpRepo := postgres.NewPostgresOTPRepository(db)
	loginEventRepo := postgres.NewPostgresLoginEventRepository(db)

	// Setup use cases
	authUseCase := usecase.NewAuthUseCase(userRepo, loginEventRepo)
	otpUseCase := usecase.NewOTPUseCase(otpRepo)

	// Setup controllers
	authController := controller.NewAuthController(authUseCase)
	otpController := controller.NewOTPController(otpUseCase)

	// Setup routes
	route.SetupRoutes(router, authController, otpController)

	log.Printf("Server starting on :8080")
	if err := router.Run(); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
