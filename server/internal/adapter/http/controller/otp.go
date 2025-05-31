package controller

import (
	"log/slog"
	"net/http"

	"github.com/bug-breeder/2fair/server/internal/domain/dto"
	"github.com/bug-breeder/2fair/server/internal/domain/models"
	"github.com/bug-breeder/2fair/server/internal/usecase"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

// OTPController handles OTP-related HTTP requests
type OTPController struct {
	otpUseCase *usecase.OTPUseCase
	logger     *slog.Logger
}

// NewOTPController creates a new OTP controller instance
func NewOTPController(otpUseCase *usecase.OTPUseCase) *OTPController {
	return &OTPController{
		otpUseCase: otpUseCase,
		logger:     slog.Default().With("component", "OTPController"),
	}
}

// @Summary Add OTP
// @Description Add a new OTP for the authenticated user
// @Tags otp
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param otp body models.OTP true "OTP details"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/otp [post]
func (ctrl *OTPController) AddOTP(c *gin.Context) {
	userID := c.MustGet("userID").(string)
	var otp models.OTP
	if err := c.ShouldBindJSON(&otp); err != nil {
		ctrl.logger.Warn("Invalid OTP request body",
			"userID", userID,
			"error", err)
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	err := ctrl.otpUseCase.AddOTP(c, userID, &otp)
	if err != nil {
		ctrl.logger.Error("Failed to add OTP",
			"userID", userID,
			"issuer", otp.Issuer,
			"error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to add OTP"})
		return
	}

	ctrl.logger.Info("OTP added via API",
		"userID", userID,
		"issuer", otp.Issuer)
	c.JSON(http.StatusOK, otp)
}

// @Summary List OTPs
// @Description Get all OTPs for the authenticated user
// @Tags otp
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.OTP
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/otp [get]
func (ctrl *OTPController) ListOTPs(c *gin.Context) {
	userID := c.MustGet("userID").(string)

	otps, err := ctrl.otpUseCase.ListOTPs(c, userID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			ctrl.logger.Warn("No OTPs found for user", "userID", userID)
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "User not found"})
			return
		}
		ctrl.logger.Error("Failed to list OTPs",
			"userID", userID,
			"error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to fetch OTPs"})
		return
	}

	var otpsResponse []dto.ListOTPsResponse
	for _, otp := range otps {
		otpsResponse = append(otpsResponse, dto.ListOTPsResponse{
			ID:        otp.ID,
			Issuer:    otp.Issuer,
			Label:     otp.Label,
			Algorithm: otp.Algorithm,
			Digits:    otp.Digits,
			Period:    otp.Period,
			Counter:   otp.Counter,
			Method:    otp.Method,
		})
	}

	ctrl.logger.Debug("Listed OTPs via API",
		"userID", userID,
		"count", len(otpsResponse))
	c.JSON(http.StatusOK, otpsResponse)
}

// @Summary Edit OTP
// @Description Edit an existing OTP
// @Tags otp
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "OTP ID"
// @Param otp body models.OTP true "Updated OTP details"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/otp/{id} [put]
func (ctrl *OTPController) EditOTP(c *gin.Context) {
	userID := c.MustGet("userID").(string)
	otpID := c.Param("id")

	ctrl.logger.Info("EditOTP request received",
		"userID", userID,
		"otpID", otpID)

	var updatedOTP models.OTP
	if err := c.ShouldBindJSON(&updatedOTP); err != nil {
		ctrl.logger.Warn("Invalid edit OTP request body",
			"userID", userID,
			"otpID", otpID,
			"error", err)
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	ctrl.logger.Info("EditOTP parsed request body",
		"userID", userID,
		"otpID", otpID,
		"updatedOTP", updatedOTP)

	err := ctrl.otpUseCase.EditOTP(c, userID, otpID, &updatedOTP)
	if err != nil {
		ctrl.logger.Error("Failed to edit OTP",
			"userID", userID,
			"otpID", otpID,
			"error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to edit OTP"})
		return
	}

	ctrl.logger.Info("OTP edited successfully via API",
		"userID", userID,
		"otpID", otpID,
		"newIssuer", updatedOTP.Issuer)
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "OTP updated"})
}

// @Summary Inactivate OTP
// @Description Mark an OTP as inactive
// @Tags otp
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "OTP ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/otp/{id}/inactivate [post]
func (ctrl *OTPController) InactivateOTP(c *gin.Context) {
	userID := c.MustGet("userID").(string)
	otpID := c.Param("id")

	err := ctrl.otpUseCase.InactivateOTP(c, userID, otpID)
	if err != nil {
		ctrl.logger.Error("Failed to inactivate OTP",
			"userID", userID,
			"otpID", otpID,
			"error", err)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to inactivate OTP"})
		return
	}

	ctrl.logger.Info("OTP inactivated via API",
		"userID", userID,
		"otpID", otpID)
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "OTP inactivated"})
}

// @Summary Generate OTP codes
// @Description Generate current and next OTP codes for the user
// @Tags otp
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} dto.GenerateOTPCodesResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /api/v1/otp/codes [get]
func (ctrl *OTPController) GenerateOTPCodes(c *gin.Context) {
	userID := c.MustGet("userID").(string)

	ctrl.logger.Debug("Generating OTP codes via API", "userID", userID)

	codes, err := ctrl.otpUseCase.GenerateOTPCodes(c, userID)
	if err != nil {
		ctrl.logger.Error("Failed to generate OTP codes",
			"userID", userID,
			"error", err)

		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to fetch OTPs: " + err.Error()})
		return
	}

	ctrl.logger.Debug("Generated OTP codes via API",
		"userID", userID,
		"codeCount", len(codes))
	c.JSON(http.StatusOK, codes)
}
