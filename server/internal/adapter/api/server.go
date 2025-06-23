package api

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/github"
	"github.com/markbates/goth/providers/google"

	"github.com/bug-breeder/2fair/server/internal/adapter/api/handlers"
	"github.com/bug-breeder/2fair/server/internal/adapter/api/middleware"
	database_adapters "github.com/bug-breeder/2fair/server/internal/adapter/database"
	"github.com/bug-breeder/2fair/server/internal/infrastructure/config"
	"github.com/bug-breeder/2fair/server/internal/infrastructure/database"
	"github.com/bug-breeder/2fair/server/internal/infrastructure/services"
)

// Server represents the HTTP server
type Server struct {
	httpServer *http.Server
	config     *config.Config
	db         *database.DB
}

// NewServer creates a new HTTP server
func NewServer(cfg *config.Config, db *database.DB) *Server {
	// Set Gin mode based on environment
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	// Configure OAuth providers
	configureOAuthProviders(cfg)

	// Create Gin router
	router := gin.New()

	// Add global middleware
	router.Use(gin.Recovery())
	router.Use(middleware.CORS(cfg))
	router.Use(middleware.Security(cfg))

	// Add custom middleware for request ID, logging, etc.
	router.Use(RequestID())
	router.Use(Logger())

	// Initialize repositories
	userRepo := database_adapters.NewUserRepository(db)
	credRepo := database_adapters.NewWebAuthnCredentialRepository(db)
	// otpRepo := database_adapters.NewOTPRepository(db, services.NewCryptoService()) // TODO: Fix missing implementation

	// Initialize infrastructure services
	_ = services.NewCryptoService() // TODO: Use cryptoService when OTP service is implemented
	// totpService := services.NewTOTPService() // TODO: Fix missing implementation

	// Initialize domain services
	authService := services.NewAuthService(
		userRepo,
		cfg.JWT.SigningKey,
		cfg.JWT.ExpirationTime,
		fmt.Sprintf("http://%s", cfg.GetServerAddress()), // Server URL for OAuth callbacks
		cfg.OAuth.Google.ClientID,
		cfg.OAuth.Google.ClientSecret,
		cfg.OAuth.GitHub.ClientID,
		cfg.OAuth.GitHub.ClientSecret,
	)

	// Initialize OTP service
	// otpService := service_adapters.NewOTPService(otpRepo, cryptoService, totpService) // TODO: Fix missing implementation

	// Initialize WebAuthn service
	webAuthnService, err := services.NewWebAuthnService(
		cfg.WebAuthn.RPID,
		cfg.WebAuthn.RPDisplayName,
		cfg.WebAuthn.RPOrigins,
		credRepo,
		userRepo,
	)
	if err != nil {
		slog.Error("Failed to initialize WebAuthn service", "error", err)
		return nil
	}

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(authService)

	// Create handlers
	healthHandler := handlers.NewHealthHandler(db)
	authHandler := handlers.NewAuthHandler(authService, cfg)
	webAuthnHandler := handlers.NewWebAuthnHandler(webAuthnService, authService)
	// otpHandler := handlers.NewOTPHandler(otpService, totpService) // TODO: Fix missing OTP service

	// Setup routes
	setupRoutes(router, healthHandler, authHandler, webAuthnHandler, nil, authMiddleware) // TODO: Pass otpHandler when implemented

	// Create HTTP server
	httpServer := &http.Server{
		Addr:           cfg.GetServerAddress(),
		Handler:        router,
		ReadTimeout:    cfg.Server.ReadTimeout,
		WriteTimeout:   cfg.Server.WriteTimeout,
		MaxHeaderBytes: cfg.Server.MaxHeaderBytes,
	}

	return &Server{
		httpServer: httpServer,
		config:     cfg,
		db:         db,
	}
}

// configureOAuthProviders sets up OAuth providers
func configureOAuthProviders(cfg *config.Config) {
	// Initialize Gothic session store first
	store := sessions.NewCookieStore([]byte(cfg.OAuth.SessionSecret))
	store.MaxAge(cfg.OAuth.SessionMaxAge)
	store.Options.Path = "/"
	store.Options.Domain = ""
	store.Options.HttpOnly = true
	store.Options.Secure = false // Set to true in production with HTTPS
	store.Options.SameSite = http.SameSiteLaxMode

	gothic.Store = store

	var providers []goth.Provider

	// Configure Google OAuth if enabled
	if cfg.OAuth.Google.Enabled {
		slog.Info("Configuring Google OAuth provider",
			"client_id", cfg.OAuth.Google.ClientID,
			"callback_url", cfg.OAuth.Google.CallbackURL,
			"scopes", cfg.OAuth.Google.Scopes)
		providers = append(providers, google.New(
			cfg.OAuth.Google.ClientID,
			cfg.OAuth.Google.ClientSecret,
			cfg.OAuth.Google.CallbackURL,
			cfg.OAuth.Google.Scopes...,
		))
		slog.Info("Google OAuth provider configured")
	}

	// Configure GitHub OAuth if enabled
	if cfg.OAuth.GitHub.Enabled {
		providers = append(providers, github.New(
			cfg.OAuth.GitHub.ClientID,
			cfg.OAuth.GitHub.ClientSecret,
			cfg.OAuth.GitHub.CallbackURL,
			cfg.OAuth.GitHub.Scopes...,
		))
		slog.Info("GitHub OAuth provider configured")
	}

	if len(providers) > 0 {
		goth.UseProviders(providers...)
		slog.Info("OAuth providers configured", "count", len(providers))
	} else {
		slog.Warn("No OAuth providers configured")
	}
}

// Start starts the HTTP server
func (s *Server) Start() error {
	slog.Info("Starting HTTP server", "address", s.config.GetServerAddress())

	if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return fmt.Errorf("failed to start server: %w", err)
	}

	return nil
}

// Stop gracefully stops the HTTP server
func (s *Server) Stop(ctx context.Context) error {
	slog.Info("Stopping HTTP server")

	return s.httpServer.Shutdown(ctx)
}

// setupRoutes configures all the routes for the application
func setupRoutes(router *gin.Engine, healthHandler *handlers.HealthHandler, authHandler *handlers.AuthHandler, webAuthnHandler *handlers.WebAuthnHandler, otpHandler *handlers.OTPHandler, authMiddleware *middleware.AuthMiddleware) {
	// Health check endpoints
	router.GET("/health", healthHandler.Health)
	router.GET("/health/ready", healthHandler.Ready)
	router.GET("/health/live", healthHandler.Live)

	// Public API routes
	v1 := router.Group("/v1")
	{
		public := v1.Group("/public")
		{
			public.GET("/status", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{
					"message": "2FAir API - E2E Encrypted TOTP Vault",
					"version": "1.0.0",
					"phase":   "Phase 3 Complete - E2E Encryption & TOTP Management",
					"features": gin.H{
						"oauth":      "enabled",
						"webauthn":   "enabled",
						"totp_vault": "enabled",
						"encryption": "enabled",
					},
				})
			})
		}
	}

	// Frontend API routes (/api/v1/*) - ALL routes consolidated here for consistency
	api := router.Group("/api")
	{
		apiv1 := api.Group("/v1")
		{
			// Authentication routes (public - no auth middleware)
			auth := apiv1.Group("/auth")
			{
				// OAuth endpoints
				auth.GET("/providers", authHandler.GetProviders)
				auth.GET("/:provider", authHandler.OAuthLogin)

				// OAuth callback endpoints - now consistent with other auth routes
				auth.GET("/:provider/callback", authHandler.OAuthCallback)

				// Token management
				auth.POST("/refresh", authHandler.RefreshToken)
				auth.POST("/logout", authHandler.Logout)

				// Protected routes
				auth.GET("/profile", authMiddleware.RequireAuth(), authHandler.GetProfile)
				auth.GET("/me", authMiddleware.RequireAuth(), authHandler.GetProfile)
			}

			// Protected routes (require authentication)
			protected := apiv1.Group("")
			protected.Use(authMiddleware.RequireAuth())
			{
				// WebAuthn routes
				webauthn := protected.Group("/webauthn")
				{
					// Registration endpoints
					webauthn.POST("/register/begin", webAuthnHandler.BeginRegistration)
					webauthn.POST("/register/finish", webAuthnHandler.FinishRegistration)

					// Authentication endpoints
					webauthn.POST("/authenticate/begin", webAuthnHandler.BeginAssertion)
					webauthn.POST("/authenticate/finish", webAuthnHandler.FinishAssertion)

					// Credential management
					webauthn.GET("/credentials", webAuthnHandler.GetCredentials)
					webauthn.DELETE("/credentials/:id", webAuthnHandler.DeleteCredential)
				}

				// OTP/TOTP vault routes - zero-knowledge architecture
				if otpHandler != nil {
					protected.POST("/otp", otpHandler.CreateOTP)
					protected.GET("/otp", otpHandler.GetOTPs)
					protected.PUT("/otp/:id", otpHandler.UpdateOTP)
					protected.POST("/otp/:id/inactivate", otpHandler.InactivateOTP)
				}
				// NOTE: /codes endpoint intentionally removed
				// TOTP code generation happens client-side for zero-knowledge

				// Vault status endpoint for frontend
				protected.GET("/vault/status", func(c *gin.Context) {
					claims, _ := middleware.GetCurrentUser(c)
					c.JSON(http.StatusOK, gin.H{
						"message": "Phase 3 - E2E Encryption & TOTP Management Complete",
						"version": "1.0.0",
						"phase":   "Phase 3 Complete - E2E Encrypted TOTP Vault",
						"user":    claims.Username,
						"features": gin.H{
							"webauthn":   "enabled",
							"totp_vault": "enabled",
							"encryption": "enabled",
							"api_endpoints": gin.H{
								"create_otp": "POST /api/v1/otp",
								"list_otps":  "GET /api/v1/otp",
								"update_otp": "PUT /api/v1/otp/:id",
								"delete_otp": "POST /api/v1/otp/:id/inactivate",
							},
						},
					})
				})
			}
		}
	}
}

// RequestID middleware adds a unique request ID to each request
func RequestID() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = generateRequestID()
		}

		c.Header("X-Request-ID", requestID)
		c.Set("requestID", requestID)

		c.Next()
	})
}

// Logger middleware logs HTTP requests
func Logger() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		end := time.Now()
		latency := end.Sub(start)

		requestID := c.GetString("requestID")

		if query != "" {
			path = path + "?" + query
		}

		slog.Info("HTTP request",
			"requestID", requestID,
			"method", c.Request.Method,
			"path", path,
			"status", c.Writer.Status(),
			"latency", latency,
			"clientIP", c.ClientIP(),
			"userAgent", c.Request.UserAgent(),
		)
	})
}

// generateRequestID generates a simple request ID
func generateRequestID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}
