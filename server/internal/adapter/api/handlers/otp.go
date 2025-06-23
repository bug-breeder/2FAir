package handlers

import (
	"net/http"

	"github.com/bug-breeder/2fair/server/internal/domain/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// OTPHandler handles OTP/TOTP vault endpoints
type OTPHandler struct {
	otpService services.OTPService
	// totpService infraServices.TOTPService // TODO: Re-enable when TOTP service is implemented
}

// NewOTPHandler creates a new OTP handler
func NewOTPHandler(otpService services.OTPService) *OTPHandler {
	return &OTPHandler{
		otpService: otpService,
		// totpService: totpService, // TODO: Re-enable when TOTP service is implemented
	}
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// SuccessResponse represents a success response
type SuccessResponse struct {
	Message string `json:"message"`
}

// CreateOTPRequest represents the request body for creating a new OTP
type CreateOTPRequest struct {
	Issuer     string `json:"issuer" binding:"required"`
	Label      string `json:"label" binding:"required"`
	Secret     string `json:"secret" binding:"required"`
	Period     int    `json:"period"`
	Algorithm  string `json:"algorithm"`
	Digits     int    `json:"digits"`
	OTPAuthURL string `json:"otpauth_url"` // Alternative to individual fields
}

// UpdateOTPRequest represents the request body for updating an OTP
type UpdateOTPRequest struct {
	Issuer    string `json:"issuer" binding:"required"`
	Label     string `json:"label" binding:"required"`
	Secret    string `json:"secret" binding:"required"`
	Period    int    `json:"period"`
	Algorithm string `json:"algorithm"`
	Digits    int    `json:"digits"`
}

// CreateOTP creates a new OTP entry
// @Summary Create a new OTP entry
// @Description Creates a new encrypted TOTP entry in the user's vault
// @Tags otp
// @Accept json
// @Produce json
// @Param otp body CreateOTPRequest true "OTP details"
// @Success 201 {object} entities.OTP
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /v1/api/otp [post]
func (h *OTPHandler) CreateOTP(c *gin.Context) {
	var req CreateOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse OTP auth URL if provided
	if req.OTPAuthURL != "" {
		// TODO: Re-enable when TOTP service is implemented
		c.JSON(http.StatusBadRequest, gin.H{"error": "OTP auth URL parsing not implemented yet"})
		return

		/*
			config, err := h.totpService.ParseOTPAuthURL(req.OTPAuthURL)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid OTP auth URL", "details": err.Error()})
				return
			}

			// Override request fields with parsed values
			req.Secret = config.Secret
			req.Issuer = config.Issuer
			if req.Label == "" {
				req.Label = config.AccountName
			}
			req.Algorithm = config.Algorithm
			req.Digits = config.Digits
			req.Period = config.Period
		*/
	}

	// Set defaults
	if req.Algorithm == "" {
		req.Algorithm = "SHA1"
	}
	if req.Digits == 0 {
		req.Digits = 6
	}
	if req.Period == 0 {
		req.Period = 30
	}

	// Create OTP
	otp, err := h.otpService.CreateOTP(c.Request.Context(), userID.(uuid.UUID), req.Issuer, req.Label, req.Secret, req.Period, req.Algorithm, req.Digits)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create OTP", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, otp)
}

// GetOTPs retrieves all OTPs for the authenticated user
func (h *OTPHandler) GetOTPs(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	otps, err := h.otpService.ListOTPs(c.Request.Context(), userID.(uuid.UUID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve OTPs", "details": err.Error()})
		return
	}

	// Frontend expects a direct array, not wrapped in "otps"
	c.JSON(http.StatusOK, otps)
}

// GetOTP retrieves a specific OTP by ID
func (h *OTPHandler) GetOTP(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse OTP ID
	otpIDStr := c.Param("id")
	otpID, err := uuid.Parse(otpIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid OTP ID"})
		return
	}

	otp, err := h.otpService.GetOTP(c.Request.Context(), otpID, userID.(uuid.UUID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "OTP not found", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, otp)
}

// GetOTPCodes endpoint removed - violates zero-knowledge architecture
// TOTP code generation should happen client-side only for true E2E encryption

// UpdateOTP updates an existing OTP entry
// @Summary Update an OTP entry
// @Description Updates an existing encrypted TOTP entry in the user's vault
// @Tags otp
// @Accept json
// @Produce json
// @Param id path string true "OTP ID"
// @Param otp body UpdateOTPRequest true "Updated OTP details"
// @Success 200 {object} entities.OTP
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /v1/api/otp/{id} [put]
func (h *OTPHandler) UpdateOTP(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse OTP ID
	otpIDStr := c.Param("id")
	otpID, err := uuid.Parse(otpIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid OTP ID"})
		return
	}

	var req UpdateOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	// Set defaults
	if req.Algorithm == "" {
		req.Algorithm = "SHA1"
	}
	if req.Digits == 0 {
		req.Digits = 6
	}
	if req.Period == 0 {
		req.Period = 30
	}

	otp, err := h.otpService.UpdateOTP(c.Request.Context(), otpID, userID.(uuid.UUID), req.Issuer, req.Label, req.Secret, req.Period, req.Algorithm, req.Digits)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update OTP", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, otp)
}

// InactivateOTP soft deletes an OTP entry
// @Summary Inactivate an OTP entry
// @Description Soft deletes an OTP entry by marking it as inactive
// @Tags otp
// @Param id path string true "OTP ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /v1/api/otp/{id}/inactivate [post]
func (h *OTPHandler) InactivateOTP(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse OTP ID
	otpIDStr := c.Param("id")
	otpID, err := uuid.Parse(otpIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid OTP ID"})
		return
	}

	err = h.otpService.DeleteOTP(c.Request.Context(), otpID, userID.(uuid.UUID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to inactivate OTP", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "OTP inactivated successfully"})
}
