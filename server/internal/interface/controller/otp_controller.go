package controller

import (
	"net/http"

	"github.com/bug-breeder/2fair/server/internal/domain/dto"
	"github.com/bug-breeder/2fair/server/internal/domain/models"
	"github.com/bug-breeder/2fair/server/internal/usecase"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

type OTPController struct {
	otpUseCase *usecase.OTPUseCase
}

func NewOTPController(otpUseCase *usecase.OTPUseCase) *OTPController {
	return &OTPController{otpUseCase: otpUseCase}
}

// AddOTP godoc
// @Summary Add a new OTP
// @Description Add a new OTP for the user
// @Tags otps
// @Accept json
// @Produce json
// @Param otp body models.OTP true "OTP"
// @Success 200 {object} models.OTP
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /otps [post]
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

// InactivateOTP godoc
// @Summary Inactivate an OTP
// @Description Inactivate an OTP for the user
// @Tags otps
// @Accept json
// @Produce json
// @Param otpID path string true "OTP ID"
// @Success 200 {object} dto.MessageResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /otps/{otpID}/inactivate [put]
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

// EditOTP godoc
// @Summary Edit an OTP
// @Description Edit an existing OTP for the user
// @Tags otps
// @Accept json
// @Produce json
// @Param otpID path string true "OTP ID"
// @Param otp body models.OTP true "OTP"
// @Success 200 {object} dto.MessageResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /otps/{otpID} [put]
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

// ListOTPs godoc
// @Summary List OTPs
// @Description List all OTPs for the user excluding the secret
// @Tags otps
// @Accept json
// @Produce json
// @Success 200 {array} dto.ListOTPsResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /otps [get]
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
