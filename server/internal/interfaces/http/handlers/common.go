package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Common response structures
type ErrorResponse struct {
	Error   string `json:"error"`
	Details string `json:"details,omitempty"`
}

type SuccessResponse struct {
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}

// ValidationError represents a validation error with field-specific details
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

type ValidationErrorResponse struct {
	Error  string            `json:"error"`
	Fields []ValidationError `json:"fields"`
}

// Response helpers for consistent error handling
func respondWithError(c *gin.Context, statusCode int, message string, details ...string) {
	response := ErrorResponse{
		Error: message,
	}

	if len(details) > 0 {
		response.Details = details[0]
	}

	c.JSON(statusCode, response)
}

func respondWithSuccess(c *gin.Context, statusCode int, message string, data ...any) {
	response := SuccessResponse{
		Message: message,
	}

	if len(data) > 0 {
		response.Data = data[0]
	}

	c.JSON(statusCode, response)
}

// Common error responses
func respondUnauthorized(c *gin.Context, message ...string) {
	msg := "Unauthorized"
	if len(message) > 0 {
		msg = message[0]
	}
	respondWithError(c, http.StatusUnauthorized, msg)
}

func respondBadRequest(c *gin.Context, message string, details ...string) {
	respondWithError(c, http.StatusBadRequest, message, details...)
}

func respondNotFound(c *gin.Context, message string, details ...string) {
	respondWithError(c, http.StatusNotFound, message, details...)
}

func respondInternalError(c *gin.Context, message string, details ...string) {
	respondWithError(c, http.StatusInternalServerError, message, details...)
}

// getUserIDFromContext safely extracts and converts user ID from context
func getUserIDFromContext(c *gin.Context) (uuid.UUID, error) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, fmt.Errorf("user not authenticated")
	}

	userIDStr, ok := userIDInterface.(string)
	if !ok {
		return uuid.Nil, fmt.Errorf("invalid user ID format")
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return uuid.Nil, fmt.Errorf("invalid user ID format: %w", err)
	}

	return userID, nil
}

// requireUserID is a helper that gets user ID from context and handles errors
func requireUserID(c *gin.Context) (uuid.UUID, bool) {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		respondUnauthorized(c, "User not authenticated")
		return uuid.Nil, false
	}
	return userID, true
}

// parseUUIDParam parses a UUID from URL parameter and handles errors
func parseUUIDParam(c *gin.Context, paramName string) (uuid.UUID, bool) {
	paramStr := c.Param(paramName)
	if paramStr == "" {
		respondBadRequest(c, fmt.Sprintf("Missing %s parameter", paramName))
		return uuid.Nil, false
	}

	parsedUUID, err := uuid.Parse(paramStr)
	if err != nil {
		respondBadRequest(c, fmt.Sprintf("Invalid %s format", paramName), err.Error())
		return uuid.Nil, false
	}

	return parsedUUID, true
}

// bindJSONWithValidation binds JSON request and handles binding errors
func bindJSONWithValidation(c *gin.Context, obj any) bool {
	if err := c.ShouldBindJSON(obj); err != nil {
		respondBadRequest(c, "Invalid request format", err.Error())
		return false
	}
	return true
}
