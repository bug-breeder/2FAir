package usecase

import (
	"context"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/bug-breeder/2fair/server/internal/adapter/repository"
	"github.com/bug-breeder/2fair/server/internal/domain/models"
	"github.com/bug-breeder/2fair/server/internal/utils"
)

type AuthUseCase struct {
	userRepo       repository.UserRepository
	loginEventRepo repository.LoginEventRepository
}

func NewAuthUseCase(userRepo repository.UserRepository, loginEventRepo repository.LoginEventRepository) *AuthUseCase {
	return &AuthUseCase{
		userRepo:       userRepo,
		loginEventRepo: loginEventRepo,
	}
}

func (uc *AuthUseCase) CompleteUserAuth(ctx context.Context, user *models.User, ipAddress, userAgent string) (string, string, error) {
	existingUser, err := uc.userRepo.FindByEmail(ctx, user.Email)
	if err != nil {
		// Check if it's a "not found" error, which is expected for new users
		if !strings.Contains(err.Error(), "user not found") {
			log.Printf("Failed to check existing user: %v", err)
			return "", "", err
		}
		// User not found is expected for new users, set existingUser to nil
		existingUser = nil
	}

	var (
		accessToken, refreshToken string
		userID                    int
	)

	if existingUser == nil {
		// No existing user found, create a new one
		userID, err = uc.userRepo.CreateUser(ctx, user)
		if err != nil {
			log.Printf("Failed to create new user: %v", err)
			return "", "", err
		}
	} else {
		// Existing user found, return the user info without updating
		userID = existingUser.ID
	}

	// Log the login event
	loginEvent := models.LoginEvent{
		UserID:    userID,
		Timestamp: time.Now(),
		IPAddress: ipAddress,
		UserAgent: userAgent,
	}

	sessionID, err := uc.loginEventRepo.AddLoginEvent(ctx, &loginEvent)
	if err != nil {
		log.Printf("Failed to log login event: %v", err)
		return "", "", err
	}

	// Convert IDs to strings for token generation
	userIDStr := strconv.Itoa(userID)
	sessionIDStr := strconv.Itoa(sessionID)

	accessToken, err = utils.GenerateAccessToken(userIDStr)
	if err != nil {
		log.Printf("Failed to generate access token: %v", err)
		return "", "", err
	}

	refreshToken, err = utils.GenerateRefreshToken(userIDStr, sessionIDStr)
	if err != nil {
		log.Printf("Failed to generate refresh token: %v", err)
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

func (uc *AuthUseCase) GetCurrentUser(ctx context.Context, userID string) (*models.User, error) {
	userIDInt, err := strconv.Atoi(userID)
	if err != nil {
		return nil, err
	}

	user, err := uc.userRepo.FindByID(ctx, userIDInt)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (uc *AuthUseCase) ValidateToken(token string) (*models.Claims, error) {
	return utils.ValidateToken(token)
}

func (uc *AuthUseCase) RefreshTokens(ctx context.Context, claims *models.Claims) (string, error) {
	userID := claims.UserID
	sessionID := claims.SessionID

	// Convert string IDs to integers
	userIDInt, err := strconv.Atoi(userID)
	if err != nil {
		return "", err
	}

	sessionIDInt, err := strconv.Atoi(sessionID)
	if err != nil {
		return "", err
	}

	// Validate sessionID
	_, err = uc.loginEventRepo.GetLoginEventByID(ctx, userIDInt, sessionIDInt)
	if err != nil {
		return "", err
	}

	accessToken, err := utils.GenerateAccessToken(userID)
	if err != nil {
		return "", err
	}

	return accessToken, nil
}

func (uc *AuthUseCase) Logout(ctx context.Context, claims *models.Claims) error {
	userID := claims.UserID
	sessionID := claims.SessionID

	// Convert string IDs to integers
	userIDInt, err := strconv.Atoi(userID)
	if err != nil {
		return err
	}

	sessionIDInt, err := strconv.Atoi(sessionID)
	if err != nil {
		return err
	}

	err = uc.loginEventRepo.RemoveLoginEvent(ctx, userIDInt, sessionIDInt)
	if err != nil {
		return err
	}

	return nil
}

func (uc *AuthUseCase) GetLoginHistory(ctx context.Context, userID string) ([]models.LoginEvent, error) {
	userIDInt, err := strconv.Atoi(userID)
	if err != nil {
		return nil, err
	}

	// Fetch login events from the dedicated repository
	loginEvents, err := uc.loginEventRepo.ListLoginEvents(ctx, userIDInt, 100) // Limiting to last 100 login events
	if err != nil {
		return nil, err
	}

	return loginEvents, nil
}
