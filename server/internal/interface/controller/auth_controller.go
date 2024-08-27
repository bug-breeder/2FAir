package controller

import (
	"context"
	"net/http"

	"github.com/bug-breeder/2fair/server/configs"
	"github.com/bug-breeder/2fair/server/internal/domain/dto"
	"github.com/bug-breeder/2fair/server/internal/domain/models"
	"github.com/bug-breeder/2fair/server/internal/usecase"
	"github.com/gin-gonic/gin"
	"github.com/markbates/goth/gothic"
)

type AuthController struct {
	authUseCase *usecase.AuthUseCase
}

func NewAuthController(authUseCase *usecase.AuthUseCase) *AuthController {
	return &AuthController{authUseCase: authUseCase}
}

func (ctrl *AuthController) AuthHandler(c *gin.Context) {
	provider := c.Param("provider")
	if provider == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Provider is required"})
		return
	}

	c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(), "provider", provider))
	gothic.BeginAuthHandler(c.Writer, c.Request)
}

func (ctrl *AuthController) AuthCallback(c *gin.Context) {
	user, err := gothic.CompleteUserAuth(c.Writer, c.Request)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete user auth"})
		return
	}

	newUser := &models.User{
		Name:     user.Name,
		Email:    user.Email,
		Provider: user.Provider,
	}

	accessToken, refreshToken, err := ctrl.authUseCase.CompleteUserAuth(c, newUser, c.ClientIP(), c.Request.UserAgent())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete user auth"})
		return
	}

	client_domain := configs.GetEnv("CLIENT_DOMAIN")

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/auth/refresh",
		Domain:   client_domain,
		HttpOnly: true,
		Secure:   true,
	})

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/",
		Domain:   client_domain,
		HttpOnly: true,
		Secure:   true,
	})

	c.Redirect(http.StatusFound, client_domain)
}

// RefreshToken godoc
// @Summary Refresh access token
// @Description Refresh the access token using the refresh token cookie
// @Tags auth
// @Accept json
// @Produce json
// @Success 200 {object} dto.MessageResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /auth/refresh [post]
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

// Logout godoc
// @Summary Logout
// @Description Clear the authentication cookies
// @Tags auth
// @Accept json
// @Produce json
// @Success 200 {object} dto.MessageResponse
// @Router /auth/logout [post]
func (ctrl *AuthController) Logout(c *gin.Context) {
	go func() {
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

		err = ctrl.authUseCase.Logout(c, claims)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to log out"})
			return
		}
	}()

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/auth/refresh",
		HttpOnly: true,
		Secure:   true,
		MaxAge:   -1,
	})

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		MaxAge:   -1,
	})

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "Successfully logged out"})
}

// GetLoginHistory godoc
// @Summary Get login history
// @Description Get the login history for the authenticated user
// @Tags auth
// @Accept json
// @Produce json
// @Success 200 {array} models.LoginEvent
// @Failure 401 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /login-history [get]
func (ctrl *AuthController) GetLoginHistory(c *gin.Context) {
	userID := c.MustGet("userID").(string)
	loginHistory, err := ctrl.authUseCase.GetLoginHistory(c, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to fetch login history"})
		return
	}

	c.JSON(http.StatusOK, loginHistory)
}
