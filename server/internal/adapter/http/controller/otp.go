package controller

import (
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
}

// NewOTPController creates a new OTP controller instance
func NewOTPController(otpUseCase *usecase.OTPUseCase) *OTPController {
	return &OTPController{otpUseCase: otpUseCase}
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
// @Router /otp [post]
func (ctrl *OTPController) AddOTP(c *gin.Context) {
	userID := c.MustGet("userID").(string)
	var otp models.OTP
	if err := c.ShouldBindJSON(&otp); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	err := ctrl.otpUseCase.AddOTP(c, userID, &otp)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to add OTP"})
		return
	}

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
// @Router /otp [get]
func (ctrl *OTPController) ListOTPs(c *gin.Context) {
	userID := c.MustGet("userID").(string)

	otps, err := ctrl.otpUseCase.ListOTPs(c, userID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "User not found"})
			return
		}
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
// @Router /otp/{id} [put]
func (ctrl *OTPController) EditOTP(c *gin.Context) {
	userID := c.MustGet("userID").(string)
	otpID := c.Param("otpID")
	var updatedOTP models.OTP
	if err := c.ShouldBindJSON(&updatedOTP); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	err := ctrl.otpUseCase.EditOTP(c, userID, otpID, &updatedOTP)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to edit OTP"})
		return
	}

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
// @Router /otp/{id}/inactivate [post]
func (ctrl *OTPController) InactivateOTP(c *gin.Context) {
	userID := c.MustGet("userID").(string)
	otpID := c.Param("otpID")

	err := ctrl.otpUseCase.InactivateOTP(c, userID, otpID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to inactivate OTP"})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "OTP inactivated"})
}

// GenerateOTPCodes godoc
// @Summary Generate OTP codes
// @Description Generate current and next OTP codes for the user
// @Tags otps
// @Accept json
// @Produce json
// @Success 200 {array} dto.GenerateOTPCodesResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /otps/codes [get]
func (ctrl *OTPController) GenerateOTPCodes(c *gin.Context) {
	userID := c.MustGet("userID").(string)

	codes, err := ctrl.otpUseCase.GenerateOTPCodes(c, userID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to fetch OTPs"})
		return
	}

	c.JSON(http.StatusOK, codes)
}
