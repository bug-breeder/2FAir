package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/bug-breeder/2fair/server/internal/domain/services"
	"github.com/bug-breeder/2fair/server/internal/infrastructure/config"
	"github.com/gin-gonic/gin"
	"github.com/markbates/goth/gothic"
)

// AuthHandler handles authentication endpoints
type AuthHandler struct {
	authService services.AuthService
	config      *config.Config
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(authService services.AuthService, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		config:      cfg,
	}
}

// OAuthLogin initiates OAuth login flow
// @Summary Start OAuth login
// @Description Initiates OAuth login flow with the specified provider
// @Tags auth
// @Param provider path string true "OAuth provider (google, github)"
// @Success 302 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Router /auth/{provider} [get]
func (h *AuthHandler) OAuthLogin(c *gin.Context) {
	provider := c.Param("provider")

	// Validate provider
	if provider != "google" && provider != "github" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported provider"})
		return
	}

	// Set provider in query params for gothic
	q := c.Request.URL.Query()
	q.Add("provider", provider)
	c.Request.URL.RawQuery = q.Encode()

	// Start OAuth flow
	gothic.BeginAuthHandler(c.Writer, c.Request)
}

// OAuthCallback handles OAuth callback
// @Summary Handle OAuth callback
// @Description Handles OAuth callback from provider
// @Tags auth
// @Param provider path string true "OAuth provider (google, github)"
// @Param code query string true "OAuth authorization code"
// @Param state query string true "OAuth state parameter"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /auth/{provider}/callback [get]
func (h *AuthHandler) OAuthCallback(c *gin.Context) {
	provider := c.Param("provider")

	// Set provider in query params for gothic
	q := c.Request.URL.Query()
	q.Add("provider", provider)
	c.Request.URL.RawQuery = q.Encode()

	// Complete OAuth flow
	gothUser, err := gothic.CompleteUserAuth(c.Writer, c.Request)
	if err != nil {
		// Log the actual error for debugging
		fmt.Printf("OAuth CompleteUserAuth error: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "OAuth authentication failed", "details": err.Error()})
		return
	}

	// Log successful OAuth data
	fmt.Printf("OAuth success - User: %+v\n", gothUser)

	// Convert to our OAuth provider format
	username := gothUser.NickName
	if username == "" {
		// Generate username from email if NickName is empty (common with Google OAuth)
		atIndex := 0
		for i, c := range gothUser.Email {
			if c == '@' {
				atIndex = i
				break
			}
		}
		if atIndex > 0 {
			username = gothUser.Email[:atIndex]
		} else {
			// Fallback username
			username = fmt.Sprintf("user_%d", time.Now().Unix())
		}
	}

	fmt.Printf("Generated username: %s for email: %s\n", username, gothUser.Email)

	// Generate display name with fallback
	displayName := gothUser.Name
	if displayName == "" {
		// Fallback to username if no display name provided
		displayName = username
	}

	oauthData := &services.OAuthProvider{
		Provider:    provider,
		UserID:      gothUser.UserID,
		Email:       gothUser.Email,
		Username:    username,
		DisplayName: displayName,
		AvatarURL:   gothUser.AvatarURL,
	}

	// Register or login user
	fmt.Printf("Attempting to register/login user with data: %+v\n", oauthData)
	user, err := h.authService.RegisterOrLoginUser(c.Request.Context(), oauthData)
	if err != nil {
		// Log the actual registration error
		fmt.Printf("RegisterOrLoginUser error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to register/login user", "details": err.Error()})
		return
	}

	fmt.Printf("User registered/logged in successfully: %+v\n", user)

	// Generate JWT token
	token, err := h.authService.GenerateJWT(user)
	if err != nil {
		// Log JWT generation error
		fmt.Printf("GenerateJWT error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token", "details": err.Error()})
		return
	}

	fmt.Printf("JWT token generated successfully\n")

	// Set token in cookie
	c.SetCookie(
		"auth_token",
		token,
		int(24*time.Hour.Seconds()), // 24 hours
		"/",
		"",
		false, // not HTTPS-only for development
		true,  // HTTP-only
	)

	// Redirect back to frontend with token
	redirectURL := fmt.Sprintf("%s/?token=%s", h.config.Frontend.URL, token)

	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

// Logout handles user logout
// @Summary Logout user
// @Description Logs out the current user
// @Tags auth
// @Success 200 {object} map[string]string
// @Router /auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	// Clear auth cookie
	c.SetCookie(
		"auth_token",
		"",
		-1,
		"/",
		"",
		false,
		true,
	)

	c.JSON(http.StatusOK, gin.H{"message": "logged out successfully"})
}

// RefreshToken refreshes the JWT token
// @Summary Refresh JWT token
// @Description Refreshes the JWT token if it's close to expiry
// @Tags auth
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /auth/refresh [post]
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	// Get token from cookie or header
	token, err := c.Cookie("auth_token")
	if err != nil {
		// Try Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "no token provided"})
			return
		}

		// Extract token from "Bearer <token>"
		if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
			token = authHeader[7:]
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token format"})
			return
		}
	}

	// Refresh token
	newToken, err := h.authService.RefreshJWT(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "failed to refresh token"})
		return
	}

	// Set new token in cookie
	c.SetCookie(
		"auth_token",
		newToken,
		int(24*time.Hour.Seconds()),
		"/",
		"",
		false,
		true,
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "token refreshed successfully",
		"token":   newToken,
	})
}

// GetProfile returns the current user's profile
// @Summary Get user profile
// @Description Returns the current authenticated user's profile
// @Tags auth
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]string
// @Router /auth/profile [get]
func (h *AuthHandler) GetProfile(c *gin.Context) {
	// Get user from context (set by auth middleware)
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found in context"})
		return
	}

	claims, ok := userInterface.(*services.JWTClaims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user context"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":       claims.UserID,
			"username": claims.Username,
			"email":    claims.Email,
		},
	})
}

// GetProviders returns available OAuth providers
// @Summary Get OAuth providers
// @Description Returns list of available OAuth providers
// @Tags auth
// @Success 200 {object} map[string]interface{}
// @Router /auth/providers [get]
func (h *AuthHandler) GetProviders(c *gin.Context) {
	providers := []map[string]string{
		{
			"name":        "Google",
			"provider":    "google",
			"login_url":   fmt.Sprintf("http://%s/api/v1/auth/google", c.Request.Host),
			"description": "Sign in with Google",
		},
		{
			"name":        "GitHub",
			"provider":    "github",
			"login_url":   fmt.Sprintf("http://%s/api/v1/auth/github", c.Request.Host),
			"description": "Sign in with GitHub",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"providers": providers,
	})
}
