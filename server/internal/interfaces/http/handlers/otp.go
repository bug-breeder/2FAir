package handlers

import (
	"net/http"

	infraServices "github.com/bug-breeder/2fair/server/internal/infrastructure/services"
	"github.com/gin-gonic/gin"
)

// OTPHandler handles OTP/TOTP vault endpoints
type OTPHandler struct {
	otpService infraServices.OTPService
	// totpService infraServices.TOTPService // TODO: Re-enable when TOTP service is implemented
}

// NewOTPHandler creates a new OTP handler
func NewOTPHandler(otpService infraServices.OTPService) *OTPHandler {
	return &OTPHandler{
		otpService: otpService,
		// totpService: totpService, // TODO: Re-enable when TOTP service is implemented
	}
}

// setOTPDefaults sets default values for OTP request fields
func setOTPDefaults(algorithm *string, digits *int, period *int) {
	if *algorithm == "" {
		*algorithm = "SHA1"
	}
	if *digits == 0 {
		*digits = 6
	}
	if *period == 0 {
		*period = 30
	}
}

// CreateOTPRequest represents the request body for creating a new OTP
type CreateOTPRequest struct {
	Issuer     string `json:"issuer" binding:"required"`
	Label      string `json:"label" binding:"required"`
	Secret     string `json:"secret" binding:"required"` // Client-encrypted: "ciphertext.iv.authTag"
	Period     int    `json:"period"`
	Algorithm  string `json:"algorithm"`
	Digits     int    `json:"digits"`
	OTPAuthURL string `json:"otpauth_url"` // Alternative to individual fields (not implemented)
}

// UpdateOTPRequest represents the request body for updating an OTP
type UpdateOTPRequest struct {
	Issuer    string `json:"issuer" binding:"required"`
	Label     string `json:"label" binding:"required"`
	Secret    string `json:"secret" binding:"required"` // Client-encrypted: "ciphertext.iv.authTag"
	Period    int    `json:"period"`
	Algorithm string `json:"algorithm"`
	Digits    int    `json:"digits"`
}

// CreateOTP creates a new OTP entry
// @Summary Create a new encrypted TOTP entry
// @Description Creates a new TOTP entry with client-side encrypted secret. The secret field should contain pre-encrypted data in format "ciphertext.iv.authTag". Server never sees plaintext TOTP secrets.
// @Tags otp
// @Accept json
// @Produce json
// @Param otp body CreateOTPRequest true "OTP details with encrypted secret"
// @Success 201 {object} entities.OTP
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/otp [post]
func (h *OTPHandler) CreateOTP(c *gin.Context) {
	// Get authenticated user ID
	userID, ok := requireUserID(c)
	if !ok {
		return // Error already handled by requireUserID
	}

	// Bind and validate JSON request
	var req CreateOTPRequest
	if !bindJSONWithValidation(c, &req) {
		return // Error already handled by bindJSONWithValidation
	}

	// Check for unimplemented OTP auth URL feature
	if req.OTPAuthURL != "" {
		respondBadRequest(c, "OTP auth URL parsing not implemented yet")
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

	// Set default values
	setOTPDefaults(&req.Algorithm, &req.Digits, &req.Period)

	// Create OTP through service
	otp, err := h.otpService.CreateOTP(c.Request.Context(), userID, req.Issuer, req.Label, req.Secret, req.Period, req.Algorithm, req.Digits)
	if err != nil {
		respondInternalError(c, "Failed to create OTP", err.Error())
		return
	}

	c.JSON(http.StatusCreated, otp)
}

// GetOTPs retrieves all OTPs for the authenticated user
// @Summary List all TOTP entries
// @Description Retrieves all TOTP entries for the authenticated user. Secrets are returned in encrypted format and must be decrypted client-side.
// @Tags otp
// @Accept json
// @Produce json
// @Success 200 {array} entities.OTP
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/otp [get]
func (h *OTPHandler) GetOTPs(c *gin.Context) {
	// Get authenticated user ID
	userID, ok := requireUserID(c)
	if !ok {
		return // Error already handled by requireUserID
	}

	// Retrieve OTPs through service
	otps, err := h.otpService.ListOTPs(c.Request.Context(), userID)
	if err != nil {
		respondInternalError(c, "Failed to retrieve OTPs", err.Error())
		return
	}

	// Frontend expects a direct array, not wrapped in "otps"
	c.JSON(http.StatusOK, otps)
}

// GetOTP retrieves a specific OTP by ID
func (h *OTPHandler) GetOTP(c *gin.Context) {
	// Get authenticated user ID
	userID, ok := requireUserID(c)
	if !ok {
		return // Error already handled by requireUserID
	}

	// Parse and validate OTP ID from URL
	otpID, ok := parseUUIDParam(c, "id")
	if !ok {
		return // Error already handled by parseUUIDParam
	}

	// Retrieve OTP through service
	otp, err := h.otpService.GetOTP(c.Request.Context(), otpID, userID)
	if err != nil {
		respondNotFound(c, "OTP not found", err.Error())
		return
	}

	c.JSON(http.StatusOK, otp)
}

// GetOTPCodes endpoint removed - violates zero-knowledge architecture
// TOTP code generation should happen client-side only for true E2E encryption

// UpdateOTP updates an existing OTP entry
// @Summary Update an encrypted TOTP entry
// @Description Updates an existing TOTP entry with client-side encrypted secret. The secret field should contain pre-encrypted data in format "ciphertext.iv.authTag".
// @Tags otp
// @Accept json
// @Produce json
// @Param id path string true "OTP ID"
// @Param otp body UpdateOTPRequest true "Updated OTP details with encrypted secret"
// @Success 200 {object} entities.OTP
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/otp/{id} [put]
func (h *OTPHandler) UpdateOTP(c *gin.Context) {
	// Get authenticated user ID
	userID, ok := requireUserID(c)
	if !ok {
		return // Error already handled by requireUserID
	}

	// Parse and validate OTP ID from URL
	otpID, ok := parseUUIDParam(c, "id")
	if !ok {
		return // Error already handled by parseUUIDParam
	}

	// Bind and validate JSON request
	var req UpdateOTPRequest
	if !bindJSONWithValidation(c, &req) {
		return // Error already handled by bindJSONWithValidation
	}

	// Set default values
	setOTPDefaults(&req.Algorithm, &req.Digits, &req.Period)

	// Update OTP through service
	otp, err := h.otpService.UpdateOTP(c.Request.Context(), otpID, userID, req.Issuer, req.Label, req.Secret, req.Period, req.Algorithm, req.Digits)
	if err != nil {
		respondInternalError(c, "Failed to update OTP", err.Error())
		return
	}

	c.JSON(http.StatusOK, otp)
}

// InactivateOTP soft deletes an OTP entry
// @Summary Inactivate a TOTP entry
// @Description Soft deletes a TOTP entry by marking it as inactive. The encrypted secret is permanently removed.
// @Tags otp
// @Param id path string true "OTP ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/otp/{id}/inactivate [post]
func (h *OTPHandler) InactivateOTP(c *gin.Context) {
	// Get authenticated user ID
	userID, ok := requireUserID(c)
	if !ok {
		return // Error already handled by requireUserID
	}

	// Parse and validate OTP ID from URL
	otpID, ok := parseUUIDParam(c, "id")
	if !ok {
		return // Error already handled by parseUUIDParam
	}

	// Delete OTP through service
	err := h.otpService.DeleteOTP(c.Request.Context(), otpID, userID)
	if err != nil {
		respondInternalError(c, "Failed to inactivate OTP", err.Error())
		return
	}

	respondWithSuccess(c, http.StatusOK, "OTP inactivated successfully")
}
