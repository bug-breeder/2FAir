package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/bug-breeder/2fair/server/internal/domain/interfaces"
	"github.com/bug-breeder/2fair/server/internal/infrastructure/config"
	"github.com/gin-gonic/gin"
	"github.com/markbates/goth/gothic"
)

// AuthHandler handles authentication endpoints
type AuthHandler struct {
	authService interfaces.AuthService
	config      *config.Config
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(authService interfaces.AuthService, cfg *config.Config) *AuthHandler {
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
	// Always use full email as username to guarantee uniqueness (ignore NickName/DisplayName)
	username := gothUser.Email

	fmt.Printf("Generated username: %s for email: %s\n", username, gothUser.Email)

	// Generate display name with fallback
	displayName := gothUser.Name
	if displayName == "" {
		// Fallback to username if no display name provided
		displayName = username
	}

	oauthData := &interfaces.OAuthProvider{
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

	// Set token in cookie with environment-appropriate configuration
	cookieName := "auth_token"
	cookiePath := "/"
	cookieMaxAge := int(24 * time.Hour.Seconds())                   // 24 hours
	cookieSecure := h.config.IsProduction() || h.config.IsStaging() // Secure flag: true in production/staging (HTTPS)
	cookieHttpOnly := true

	// Environment-specific cookie configuration
	var cookieDomain string
	var sameSiteMode http.SameSite

	if h.config.IsProduction() || h.config.IsStaging() {
		// Production/Staging: Cross-domain setup with HTTPS
		cookieDomain = ".2fair.app"
		sameSiteMode = http.SameSiteNoneMode // Required for cross-domain with HTTPS
	} else {
		// Development: Same-domain or localhost
		cookieDomain = ""                   // No domain restriction for localhost
		sameSiteMode = http.SameSiteLaxMode // Lax mode for same-site requests
	}

	// Set SameSite mode based on environment
	c.SetSameSite(sameSiteMode)

	c.SetCookie(
		cookieName,
		token,
		cookieMaxAge,
		cookiePath,
		cookieDomain,
		cookieSecure,
		cookieHttpOnly,
	)

	// Log cookie setting for debugging
	fmt.Printf("Cookie set: name=%s, domain=%s, secure=%v, sameSite=%v, env=%s\n",
		cookieName, cookieDomain, cookieSecure, sameSiteMode, h.config.Server.Environment)

	// Redirect back to frontend app (no token in URL - cookie is sufficient)
	redirectURL := fmt.Sprintf("%s/app", h.config.Frontend.URL)

	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

// Logout handles user logout
// @Summary Logout user
// @Description Logs out the current user
// @Tags auth
// @Success 200 {object} map[string]string
// @Router /auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	// Environment-specific cookie configuration for clearing
	var cookieDomain string
	var sameSiteMode http.SameSite

	if h.config.IsProduction() || h.config.IsStaging() {
		cookieDomain = ".2fair.app"
		sameSiteMode = http.SameSiteNoneMode
	} else {
		cookieDomain = "" // No domain restriction for localhost
		sameSiteMode = http.SameSiteLaxMode
	}

	// Set SameSite mode for cross-domain cookie clearing
	c.SetSameSite(sameSiteMode)

	// Clear auth cookie
	c.SetCookie(
		"auth_token",
		"",
		-1,
		"/",
		cookieDomain,
		h.config.IsProduction() || h.config.IsStaging(), // Secure flag: true in production/staging (HTTPS), false in development
		true, // HTTP-only
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

	// Set new token in cookie with environment-appropriate configuration
	var cookieDomain string
	var sameSiteMode http.SameSite

	if h.config.IsProduction() || h.config.IsStaging() {
		cookieDomain = ".2fair.app"
		sameSiteMode = http.SameSiteNoneMode
	} else {
		cookieDomain = "" // No domain restriction for localhost
		sameSiteMode = http.SameSiteLaxMode
	}

	c.SetSameSite(sameSiteMode) // Required for cross-domain cookies

	c.SetCookie(
		"auth_token",
		newToken,
		int(24*time.Hour.Seconds()),
		"/",
		cookieDomain,
		h.config.IsProduction() || h.config.IsStaging(), // Secure flag: true in production/staging (HTTPS), false in development
		true, // HTTP-only
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "token refreshed successfully",
		"token":   newToken,
	})
}

// Debug endpoint to check authentication status and cookie presence
// @Summary Debug authentication
// @Description Check current authentication status and cookie presence
// @Tags auth
// @Success 200 {object} map[string]interface{}
// @Router /auth/debug [get]
func (h *AuthHandler) Debug(c *gin.Context) {
	// Check for cookie
	cookieToken, cookieErr := c.Cookie("auth_token")

	// Check for header
	authHeader := c.GetHeader("Authorization")
	var headerToken string
	if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		headerToken = authHeader[7:]
	}

	// Get all cookies for debugging
	cookies := []map[string]string{}
	for _, cookie := range c.Request.Cookies() {
		cookies = append(cookies, map[string]string{
			"name":   cookie.Name,
			"value":  cookie.Value[:min(len(cookie.Value), 20)] + "...", // Truncate for security
			"domain": cookie.Domain,
			"path":   cookie.Path,
		})
	}

	response := gin.H{
		"timestamp": time.Now().Format(time.RFC3339),
		"request": gin.H{
			"host":       c.Request.Host,
			"origin":     c.GetHeader("Origin"),
			"referer":    c.GetHeader("Referer"),
			"user_agent": c.GetHeader("User-Agent"),
		},
		"cookies": gin.H{
			"auth_token_present": cookieErr == nil,
			"auth_token_error":   fmt.Sprintf("%v", cookieErr),
			"auth_token_length":  len(cookieToken),
			"all_cookies":        cookies,
		},
		"headers": gin.H{
			"authorization_present": authHeader != "",
			"header_token_present":  headerToken != "",
		},
		"environment":  h.config.Server.Environment,
		"frontend_url": h.config.Frontend.URL,
		"cors_origins": h.config.Security.CORSOrigins,
	}

	c.JSON(http.StatusOK, response)
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

	claims, ok := userInterface.(*interfaces.JWTClaims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user context"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":       claims.UserID,
		"username": claims.Username,
		"email":    claims.Email,
	})
}

// GetProviders returns available OAuth providers
// @Summary Get OAuth providers
// @Description Returns list of available OAuth providers
// @Tags auth
// @Success 200 {object} map[string]interface{}
// @Router /auth/providers [get]
func (h *AuthHandler) GetProviders(c *gin.Context) {
	// Use the server URL from configuration
	baseURL := h.config.GetServerURL()

	providers := []map[string]string{
		{
			"name":        "Google",
			"provider":    "google",
			"login_url":   fmt.Sprintf("%s/api/v1/auth/google", baseURL),
			"description": "Sign in with Google",
		},
		{
			"name":        "GitHub",
			"provider":    "github",
			"login_url":   fmt.Sprintf("%s/api/v1/auth/github", baseURL),
			"description": "Sign in with GitHub",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"providers": providers,
	})
}
