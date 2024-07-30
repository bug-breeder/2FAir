package usecase

import (
	"context"
	"log"
	"time"

	"github.com/bug-breeder/2fair/server/internal/domain/auth"
	"github.com/bug-breeder/2fair/server/internal/domain/models"
	"github.com/bug-breeder/2fair/server/internal/domain/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AuthUseCase struct {
	userRepo repository.UserRepository
}

func NewAuthUseCase(userRepo repository.UserRepository) *AuthUseCase {
	return &AuthUseCase{userRepo: userRepo}
}

func (uc *AuthUseCase) CompleteUserAuth(ctx context.Context, user *models.User) (string, string, error) {
	existingUser, err := uc.userRepo.FindByEmail(ctx, user.Email)
	if err != nil {
		log.Printf("Failed to check existing user: %v", err)
		return "", "", err
	}

	var (
		accessToken, refreshToken string
		userID                    primitive.ObjectID
	)

	if existingUser == nil {
		// No existing user found, create a new one
		user.CreatedAt = time.Now()
		user.OTPs = []models.OTP{}
		user.LoginHistory = []models.LoginEvent{}

		userID, err = uc.userRepo.CreateUser(ctx, user)
		if err != nil {
			log.Printf("Failed to create new user: %v", err)
			return "", "", err
		}

		accessToken, err = auth.GenerateAccessToken(userID.Hex(), user.Email)
		if err != nil {
			log.Printf("Failed to generate access token: %v", err)
			return "", "", err
		}

		refreshToken, err = auth.GenerateRefreshToken(userID.Hex(), user.Email)
		if err != nil {
			log.Printf("Failed to generate refresh token: %v", err)
			return "", "", err
		}

	} else {
		// Existing user found, return the user info without updating
		userID = existingUser.ID
		accessToken, err = auth.GenerateAccessToken(userID.Hex(), existingUser.Email)
		if err != nil {
			log.Printf("Failed to generate access token: %v", err)
			return "", "", err
		}

		refreshToken, err = auth.GenerateRefreshToken(userID.Hex(), existingUser.Email)
		if err != nil {
			log.Printf("Failed to generate refresh token: %v", err)
			return "", "", err
		}
	}

	// Log the login event
	loginEvent := models.LoginEvent{
		Timestamp:    time.Now(),
		IPAddress:    "", // Set IP address
		UserAgent:    "", // Set User agent
		RefreshToken: refreshToken,
	}

	err = uc.userRepo.UpdateLoginHistory(ctx, userID, loginEvent)
	if err != nil {
		log.Printf("Failed to log login event: %v", err)
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

func (uc *AuthUseCase) ValidateToken(token string) (*models.Claims, error) {
	return auth.ValidateToken(token)
}

func (uc *AuthUseCase) RefreshTokens(ctx context.Context, claims *models.Claims) (string, string, error) {
	userID := claims.UserID
	userObjectID, _ := primitive.ObjectIDFromHex(userID)

	_, err := uc.userRepo.FindByEmail(ctx, claims.Email)
	if err != nil {
		return "", "", err
	}

	accessToken, err := auth.GenerateAccessToken(userID, claims.Email)
	if err != nil {
		return "", "", err
	}

	newRefreshToken, err := auth.GenerateRefreshToken(userID, claims.Email)
	if err != nil {
		return "", "", err
	}

	err = uc.userRepo.UpdateLoginHistory(ctx, userObjectID, models.LoginEvent{
		Timestamp:    time.Now(),
		IPAddress:    "", // Set IP address
		UserAgent:    "", // Set User agent
		RefreshToken: newRefreshToken,
	})
	if err != nil {
		return "", "", err
	}

	return accessToken, newRefreshToken, nil
}

func (uc *AuthUseCase) Logout(ctx context.Context, claims *models.Claims) error {
	userID := claims.UserID
	userObjectID, _ := primitive.ObjectIDFromHex(userID)

	err := uc.userRepo.RemoveLoginEvent(ctx, userObjectID, claims.Token)
	if err != nil {
		return err
	}

	return nil
}

func (uc *AuthUseCase) GetLoginHistory(ctx context.Context, userID string) ([]models.LoginEvent, error) {
	userObjectID, _ := primitive.ObjectIDFromHex(userID)
	user, err := uc.userRepo.FindByID(ctx, userObjectID)
	if err != nil {
		return nil, err
	}

	return user.LoginHistory, nil
}
