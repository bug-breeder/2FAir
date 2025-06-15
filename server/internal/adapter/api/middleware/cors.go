package middleware

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/bug-breeder/2fair/server/internal/infrastructure/config"
)

// CORS creates a CORS middleware with the given configuration
func CORS(cfg *config.Config) gin.HandlerFunc {
	corsConfig := cors.Config{
		AllowOrigins:     cfg.Security.CORSOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Device-ID"},
		ExposeHeaders:    []string{"X-Request-ID", "X-Rate-Limit-Remaining", "X-Rate-Limit-Reset"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}

	// In development, allow all origins
	if cfg.IsDevelopment() {
		corsConfig.AllowAllOrigins = true
		corsConfig.AllowOrigins = nil
	}

	return cors.New(corsConfig)
}
