package middleware

import (
	"github.com/gin-gonic/gin"

	"github.com/bug-breeder/2fair/server/internal/infrastructure/config"
)

// Security adds security headers to all responses
func Security(cfg *config.Config) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// Content Security Policy
		c.Header("Content-Security-Policy", cfg.Security.CSPPolicy)

		// Prevent MIME type sniffing
		c.Header("X-Content-Type-Options", "nosniff")

		// Prevent clickjacking
		c.Header("X-Frame-Options", "DENY")

		// XSS Protection
		c.Header("X-XSS-Protection", "1; mode=block")

		// HTTP Strict Transport Security (HSTS)
		if cfg.IsProduction() {
			c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		}

		// Referrer Policy
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		// Permissions Policy (Feature Policy)
		c.Header("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()")

		// Cross-Origin Embedder Policy
		c.Header("Cross-Origin-Embedder-Policy", "require-corp")

		// Cross-Origin Opener Policy
		c.Header("Cross-Origin-Opener-Policy", "same-origin")

		// Cross-Origin Resource Policy
		c.Header("Cross-Origin-Resource-Policy", "same-origin")

		// Cache Control for security-sensitive endpoints
		if c.Request.URL.Path == "/auth" || c.Request.URL.Path == "/vault" {
			c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
			c.Header("Pragma", "no-cache")
			c.Header("Expires", "0")
		}

		c.Next()
	})
}
