package controller

import (
	"context"
	"net/http"

	"github.com/bug-breeder/2fair/server/internal/domain/dto"
	"github.com/bug-breeder/2fair/server/internal/domain/models"
	"github.com/bug-breeder/2fair/server/internal/infrastructure/configs"
	"github.com/bug-breeder/2fair/server/internal/usecase"
	"github.com/gin-gonic/gin"
	"github.com/markbates/goth/gothic"
)

// AuthController handles authentication-related HTTP requests
type AuthController struct {
	authUseCase *usecase.AuthUseCase
}

// NewAuthController creates a new auth controller instance
func NewAuthController(authUseCase *usecase.AuthUseCase) *AuthController {
	return &AuthController{
		authUseCase: authUseCase,
	}
}

// @Summary Login with Google
// @Description Authenticate a user using Google OAuth
// @Tags auth
// @Accept json
// @Produce json
// @Success 200 {object} models.User
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/auth/google [get]
func (ctrl *AuthController) GoogleLogin(ctx *gin.Context) {
	provider := ctx.Param("provider")
	if provider == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Provider is required"})
		return
	}

	ctx.Request = ctx.Request.WithContext(context.WithValue(ctx.Request.Context(), "provider", provider))
	gothic.BeginAuthHandler(ctx.Writer, ctx.Request)
}

// @Summary Google OAuth callback
// @Description Handle the callback from Google OAuth
// @Tags auth
// @Accept json
// @Produce json
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/auth/google/callback [get]
func (ctrl *AuthController) GoogleCallback(ctx *gin.Context) {
	user, err := gothic.CompleteUserAuth(ctx.Writer, ctx.Request)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete user auth"})
		return
	}

	newUser := &models.User{
		Name:     user.Name,
		Email:    user.Email,
		Provider: user.Provider,
	}

	accessToken, refreshToken, err := ctrl.authUseCase.CompleteUserAuth(ctx, newUser, ctx.ClientIP(), ctx.Request.UserAgent())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete user auth"})
		return
	}

	client_domain := configs.GetEnv("CLIENT_DOMAIN")

	http.SetCookie(ctx.Writer, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/auth/refresh",
		Domain:   client_domain,
		HttpOnly: true,
		Secure:   true,
	})

	http.SetCookie(ctx.Writer, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/",
		Domain:   client_domain,
		HttpOnly: true,
		Secure:   true,
	})

	ctx.Redirect(http.StatusFound, client_domain)
}

// @Summary Get current user
// @Description Get the currently authenticated user's information
// @Tags auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.User
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/auth/me [get]
func (ctrl *AuthController) GetCurrentUser(ctx *gin.Context) {
	// ... existing code ...
}

// @Summary Logout
// @Description Log out the current user
// @Tags auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/auth/logout [post]
func (ctrl *AuthController) Logout(ctx *gin.Context) {
	// ... existing code ...
}

// @Summary Refresh access token
// @Description Refresh the access token using the refresh token cookie
// @Tags auth
// @Accept json
// @Produce json
// @Success 200 {object} dto.MessageResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /api/v1/auth/refresh [post]
func (ctrl *AuthController) RefreshToken(c *gin.Context) {
	refreshTokenCookie, err := c.Request.Cookie("refresh_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "Refresh token is missing"})
		return
	}

	refreshToken := refreshTokenCookie.Value
	claims, err := ctrl.authUseCase.ValidateToken(refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "Invalid refresh token"})
		return
	}

	accessToken, err := ctrl.authUseCase.RefreshTokens(c, claims)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to refresh tokens"})
		return
	}

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
	})

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Tokens refreshed"})
}

// @Summary Get login history
// @Description Get the login history for the authenticated user
// @Tags auth
// @Accept json
// @Produce json
// @Success 200 {array} models.LoginEvent
// @Failure 401 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /api/v1/login-history [get]
func (ctrl *AuthController) GetLoginHistory(c *gin.Context) {
	userID := c.MustGet("userID").(string)
	loginHistory, err := ctrl.authUseCase.GetLoginHistory(c, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to fetch login history"})
		return
	}

	c.JSON(http.StatusOK, loginHistory)
}
