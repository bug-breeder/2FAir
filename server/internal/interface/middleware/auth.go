package middleware

import (
	"net/http"

	"github.com/bug-breeder/2fair/server/internal/domain/auth"
	"github.com/gin-gonic/gin"
)

func Authenticate() gin.HandlerFunc {
	return func(c *gin.Context) {
		cookie, err := c.Request.Cookie("access_token")
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Access token is missing"})
			c.Abort()
			return
		}

		accessToken := cookie.Value
		claims, err := auth.ValidateToken(accessToken)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid access token"})
			c.Abort()
			return
		}

		c.Set("userID", claims.UserID)
		c.Next()
	}
}
