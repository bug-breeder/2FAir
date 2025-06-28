package middleware

import (
	"net/http"
	"strings"

	infraServices "github.com/bug-breeder/2fair/server/internal/infrastructure/services"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware provides JWT authentication middleware
type AuthMiddleware struct {
	authService infraServices.AuthService
}

// NewAuthMiddleware creates a new auth middleware
func NewAuthMiddleware(authService infraServices.AuthService) *AuthMiddleware {
	return &AuthMiddleware{
		authService: authService,
	}
}

// RequireAuth middleware that requires authentication
func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := m.extractToken(c)
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "authentication required"})
			c.Abort()
			return
		}

		// Validate token
		claims, err := m.authService.ValidateJWT(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}

		// Set user in context
		c.Set("user", claims)
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("email", claims.Email)

		c.Next()
	}
}

// OptionalAuth middleware that optionally checks authentication
func (m *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := m.extractToken(c)
		if token == "" {
			// No token provided, continue without authentication
			c.Next()
			return
		}

		// Validate token if provided
		claims, err := m.authService.ValidateJWT(token)
		if err != nil {
			// Invalid token, continue without authentication
			c.Next()
			return
		}

		// Set user in context
		c.Set("user", claims)
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("email", claims.Email)

		c.Next()
	}
}

// extractToken extracts JWT token from request
func (m *AuthMiddleware) extractToken(c *gin.Context) string {
	// Try to get token from Authorization header
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		// Extract token from "Bearer <token>"
		if len(authHeader) > 7 && strings.ToLower(authHeader[:7]) == "bearer " {
			return authHeader[7:]
		}
	}

	// Try to get token from cookie
	token, err := c.Cookie("auth_token")
	if err == nil {
		return token
	}

	// Try to get token from query parameter (less secure, for testing)
	if queryToken := c.Query("token"); queryToken != "" {
		return queryToken
	}

	return ""
}

// GetCurrentUser helper function to get current user from context
func GetCurrentUser(c *gin.Context) (*infraServices.JWTClaims, bool) {
	userInterface, exists := c.Get("user")
	if !exists {
		return nil, false
	}

	claims, ok := userInterface.(*infraServices.JWTClaims)
	if !ok {
		return nil, false
	}

	return claims, true
}

// GetCurrentUserID helper function to get current user ID from context
func GetCurrentUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}

	userIDStr, ok := userID.(string)
	if !ok {
		return "", false
	}

	return userIDStr, true
}

// RequireAdmin middleware that requires admin authentication (placeholder)
func (m *AuthMiddleware) RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		// First check if user is authenticated
		token := m.extractToken(c)
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "authentication required"})
			c.Abort()
			return
		}

		// Validate token
		claims, err := m.authService.ValidateJWT(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}

		// TODO: Add admin role checking logic here
		// For now, just check if user is authenticated

		// Set user in context
		c.Set("user", claims)
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("email", claims.Email)

		c.Next()
	}
}
