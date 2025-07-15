package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/bug-breeder/2fair/server/internal/infrastructure/config"
	"github.com/bug-breeder/2fair/server/internal/infrastructure/database"
	"github.com/bug-breeder/2fair/server/internal/infrastructure/metrics"
	api "github.com/bug-breeder/2fair/server/internal/interfaces/http"

	_ "github.com/bug-breeder/2fair/server/docs" // This is important for the Swagger docs to be generated
)

// @title 2FAir API
// @version 1.0
// @description This is the API documentation for the 2FAir E2E encrypted TOTP vault application.
// @termsOfService http://swagger.io/terms/

// @contact.name Alan Nguyen
// @contact.url http://www.2fair.vip/support
// @contact.email anhngw@gmail.com

// @license.name GNU General Public License v3.0
// @license.url https://www.gnu.org/licenses/gpl-3.0.en.html

// @host localhost:8080
// @BasePath /v1
func main() {
	// Initialize structured logging
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		slog.Error("Failed to load configuration", "error", err)
		os.Exit(1)
	}

	// Initialize metrics system
	appMetrics := metrics.NewMetrics()
	slog.Info("Metrics system initialized")

	slog.Info("Starting 2FAir server",
		"environment", cfg.Server.Environment,
		"address", cfg.GetServerAddress(),
		"version", "1.0",
	)

	// Start overall application startup timer
	startupTimer := appMetrics.StartStartupTimer(cfg.Server.Environment, "2fair-server")

	// Run the application
	if err := run(cfg, appMetrics); err != nil {
		startupTimer.Complete("failed")
		slog.Error("Application failed", "error", err)
		os.Exit(1)
	}

	startupTimer.Complete("success")
	slog.Info("2FAir server shutdown complete")
}

func run(cfg *config.Config, appMetrics *metrics.Metrics) error {
	// Initialize database connection with timing
	db, err := database.NewDB(cfg, appMetrics)
	if err != nil {
		return err
	}
	defer db.Close()

	slog.Info("Database connection established")

	// Run database migrations with timing
	if err := database.RunMigrations(cfg, appMetrics); err != nil {
		return err
	}

	slog.Info("Database migrations completed")

	// Create and start HTTP server
	server := api.NewServer(cfg, db, appMetrics)

	// Channel to listen for interrupt/terminate signals
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	// Start server in a goroutine
	go func() {
		if err := server.Start(); err != nil {
			slog.Error("Server failed to start", "error", err)
			stop <- syscall.SIGTERM
		}
	}()

	slog.Info("Server started successfully")

	// Wait for interrupt signal
	<-stop

	slog.Info("Shutting down server...")

	// Create a context with timeout for graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), cfg.Server.ShutdownTimeout)
	defer cancel()

	// Attempt graceful shutdown
	if err := server.Stop(ctx); err != nil {
		slog.Error("Server forced to shutdown", "error", err)
		return err
	}

	return nil
}
