package handlers

import (
	"net/http"

	"github.com/bug-breeder/2fair/server/internal/pkg/auth"
	"github.com/gin-gonic/gin"
)

func RefreshToken(c *gin.Context) {
	refreshTokenCookie, err := c.Request.Cookie("refresh_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token is missing"})
		return
	}

	refreshToken := refreshTokenCookie.Value
	claims, err := auth.ValidateToken(refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	accessToken, err := auth.GenerateAccessToken(claims.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate access token"})
		return
	}

	newRefreshToken, err := auth.GenerateRefreshToken(claims.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
		return
	}

	// Set tokens in cookies
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
	})

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "refresh_token",
		Value:    newRefreshToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
	})

	c.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": newRefreshToken,
	})
}
