package handlers

import (
	"encoding/base64"
	"net/http"
	"strings"

	"github.com/bug-breeder/2fair/server/internal/interfaces/http/middleware"
	"github.com/bug-breeder/2fair/server/internal/domain/entities"
	infraServices "github.com/bug-breeder/2fair/server/internal/infrastructure/services"
	"github.com/gin-gonic/gin"
	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/google/uuid"
)

// WebAuthnHandler handles WebAuthn endpoints
type WebAuthnHandler struct {
	webAuthnService infraServices.WebAuthnService
	userRepo        infraServices.AuthService // Use auth service to get user info
}

// NewWebAuthnHandler creates a new WebAuthn handler
func NewWebAuthnHandler(webAuthnService infraServices.WebAuthnService, authService infraServices.AuthService) *WebAuthnHandler {
	return &WebAuthnHandler{
		webAuthnService: webAuthnService,
		userRepo:        authService,
	}
}

// SessionStore temporarily stores WebAuthn session data
// TODO: In production, use Redis or database for session storage
var sessionStore = make(map[string]*webauthn.SessionData)

// BeginRegistration starts WebAuthn credential registration
// @Summary Start WebAuthn credential registration
// @Description Begins WebAuthn credential registration for vault encryption
// @Tags webauthn
// @Security BearerAuth
// @Param authenticatorSelection body protocol.AuthenticatorSelection false "Authenticator selection criteria"
// @Success 200 {object} infraServices.WebAuthnCredentialCreation
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /v1/webauthn/register/begin [post]
func (h *WebAuthnHandler) BeginRegistration(c *gin.Context) {
	// Get current user from JWT claims
	claims, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found in context"})
		return
	}

	// Parse authenticator selection if provided
	var authenticatorSelection *protocol.AuthenticatorSelection
	if c.Request.ContentLength > 0 {
		if err := c.ShouldBindJSON(&authenticatorSelection); err != nil {
			// If binding fails, continue with nil (use defaults)
			authenticatorSelection = nil
		}
	}

	// Create user entity from claims
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	user := &entities.User{
		ID:          userID,
		Username:    claims.Username,
		Email:       claims.Email,
		DisplayName: claims.Username, // Use username as display name for now
	}

	// Begin registration
	credentialCreation, err := h.webAuthnService.BeginRegistration(c.Request.Context(), user, authenticatorSelection)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to begin registration", "details": err.Error()})
		return
	}

	// Store session data (in production, use proper session storage)
	sessionKey := claims.UserID + "_registration"
	sessionStore[sessionKey] = credentialCreation.SessionData

	// Return only the public credential creation options
	// Note: credentialCreation.PublicKeyCredentialCreationOptions is *protocol.CredentialCreation
	// which has a Response field containing the actual PublicKeyCredentialCreationOptions
	c.JSON(http.StatusOK, gin.H{
		"publicKey": credentialCreation.PublicKeyCredentialCreationOptions.Response,
	})
}

// FinishRegistration completes WebAuthn credential registration
// @Summary Complete WebAuthn credential registration
// @Description Completes WebAuthn credential registration for vault encryption
// @Tags webauthn
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /v1/webauthn/register/finish [post]
func (h *WebAuthnHandler) FinishRegistration(c *gin.Context) {
	// Get current user from JWT claims
	claims, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found in context"})
		return
	}

	// Get stored session data
	sessionKey := claims.UserID + "_registration"
	sessionData, exists := sessionStore[sessionKey]
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no registration session found"})
		return
	}

	// Create user entity from claims
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	user := &entities.User{
		ID:          userID,
		Username:    claims.Username,
		Email:       claims.Email,
		DisplayName: claims.Username,
	}

	// Finish registration using the HTTP request directly
	credential, err := h.webAuthnService.FinishRegistration(c.Request.Context(), user, sessionData, c.Request)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to complete registration", "details": err.Error()})
		return
	}

	// Clean up session data
	delete(sessionStore, sessionKey)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "WebAuthn credential registered successfully",
		"credential": gin.H{
			"id":             credential.ID,
			"credentialId":   credential.CredentialID,
			"createdAt":      credential.CreatedAt,
			"backupEligible": credential.BackupEligible,
			"backupState":    credential.BackupState,
		},
	})
}

// BeginAssertion starts WebAuthn credential assertion
// @Summary Start WebAuthn credential assertion
// @Description Begins WebAuthn credential assertion for vault key derivation
// @Tags webauthn
// @Security BearerAuth
// @Success 200 {object} infraServices.WebAuthnCredentialAssertion
// @Failure 401 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /v1/webauthn/assert/begin [post]
func (h *WebAuthnHandler) BeginAssertion(c *gin.Context) {
	// Get current user from JWT claims
	claims, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found in context"})
		return
	}

	// Create user entity from claims
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	user := &entities.User{
		ID:          userID,
		Username:    claims.Username,
		Email:       claims.Email,
		DisplayName: claims.Username,
	}

	// Begin assertion
	credentialAssertion, err := h.webAuthnService.BeginAssertion(c.Request.Context(), user, nil)
	if err != nil {
		// Check for specific "no credentials found" error
		if strings.Contains(err.Error(), "no credentials found for user") {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "no_webauthn_credentials",
				"message": "No WebAuthn credentials found. Please register a WebAuthn credential first to enable TOTP encryption.",
				"action":  "register_webauthn",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to begin assertion", "details": err.Error()})
		return
	}

	// Store session data
	sessionKey := claims.UserID + "_assertion"
	sessionStore[sessionKey] = credentialAssertion.SessionData

	// Return only the public credential request options
	// Note: credentialAssertion.PublicKeyCredentialRequestOptions is *protocol.CredentialAssertion
	// which has a Response field containing the actual PublicKeyCredentialRequestOptions
	c.JSON(http.StatusOK, gin.H{
		"publicKey": credentialAssertion.PublicKeyCredentialRequestOptions.Response,
	})
}

// FinishAssertion completes WebAuthn credential assertion
// @Summary Complete WebAuthn credential assertion
// @Description Completes WebAuthn credential assertion and returns derived key material
// @Tags webauthn
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /v1/webauthn/assert/finish [post]
func (h *WebAuthnHandler) FinishAssertion(c *gin.Context) {
	// Get current user from JWT claims
	claims, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found in context"})
		return
	}

	// Get stored session data
	sessionKey := claims.UserID + "_assertion"
	sessionData, exists := sessionStore[sessionKey]
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no assertion session found"})
		return
	}

	// Create user entity from claims
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	user := &entities.User{
		ID:          userID,
		Username:    claims.Username,
		Email:       claims.Email,
		DisplayName: claims.Username,
	}

	// Finish assertion using the HTTP request directly
	credential, prfOutput, err := h.webAuthnService.FinishAssertion(c.Request.Context(), user, sessionData, c.Request)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to complete assertion", "details": err.Error()})
		return
	}

	// Clean up session data
	delete(sessionStore, sessionKey)

	response := gin.H{
		"success": true,
		"message": "WebAuthn assertion completed successfully",
		"credential": gin.H{
			"id":           credential.ID,
			"credentialId": credential.CredentialID,
			"lastUsedAt":   credential.LastUsedAt,
			"signCount":    credential.SignCount,
		},
	}

	// Include PRF output if available (for vault key derivation)
	if len(prfOutput) > 0 {
		// Encode PRF output as base64 for JSON response
		response["prfOutput"] = base64.StdEncoding.EncodeToString(prfOutput)
		response["message"] = "WebAuthn assertion completed with PRF key derivation"
	}

	c.JSON(http.StatusOK, response)
}

// GetCredentials returns user's WebAuthn credentials
// @Summary Get user WebAuthn credentials
// @Description Returns all WebAuthn credentials for the current user
// @Tags webauthn
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /v1/webauthn/credentials [get]
func (h *WebAuthnHandler) GetCredentials(c *gin.Context) {
	// Get current user from JWT claims
	claims, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found in context"})
		return
	}

	// Get user credentials
	credentials, err := h.webAuthnService.GetUserCredentials(c.Request.Context(), claims.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get credentials"})
		return
	}

	// Return credentials without sensitive data
	credentialSummaries := make([]gin.H, len(credentials))
	for i, cred := range credentials {
		credentialSummaries[i] = gin.H{
			"id":             cred.ID,
			"createdAt":      cred.CreatedAt,
			"lastUsedAt":     cred.LastUsedAt,
			"transport":      cred.Transport,
			"attachment":     cred.Attachment,
			"backupEligible": cred.BackupEligible,
			"backupState":    cred.BackupState,
			"signCount":      cred.SignCount,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"credentials": credentialSummaries,
		"count":       len(credentials),
	})
}

// DeleteCredential deletes a WebAuthn credential
// @Summary Delete WebAuthn credential
// @Description Deletes a specific WebAuthn credential for the current user
// @Tags webauthn
// @Security BearerAuth
// @Param credentialId path string true "Credential ID"
// @Success 200 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /v1/webauthn/credentials/{credentialId} [delete]
func (h *WebAuthnHandler) DeleteCredential(c *gin.Context) {
	// Get current user from JWT claims
	claims, exists := middleware.GetCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found in context"})
		return
	}

	credentialID := c.Param("credentialId")
	if credentialID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "credential ID is required"})
		return
	}

	// Delete credential
	err := h.webAuthnService.DeleteCredential(c.Request.Context(), claims.UserID, []byte(credentialID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete credential"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "WebAuthn credential deleted successfully",
	})
}
