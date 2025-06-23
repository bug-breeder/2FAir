package services

import (
	"context"
	"fmt"
	"time"

	"github.com/bug-breeder/2fair/server/internal/domain/entities"
	"github.com/bug-breeder/2fair/server/internal/domain/repositories"
	"github.com/bug-breeder/2fair/server/internal/domain/services"
	"github.com/google/uuid"
)

type linkingCodeService struct {
	linkingCodeRepo repositories.LinkingCodeRepository
	userRepo        repositories.UserRepository
}

// NewLinkingCodeService creates a new linking code service
func NewLinkingCodeService(
	linkingCodeRepo repositories.LinkingCodeRepository,
	userRepo repositories.UserRepository,
) services.LinkingCodeService {
	return &linkingCodeService{
		linkingCodeRepo: linkingCodeRepo,
		userRepo:        userRepo,
	}
}

// GenerateCode creates a new linking code for a user
func (s *linkingCodeService) GenerateCode(ctx context.Context, userID uuid.UUID) (*entities.LinkingCode, error) {
	// Verify user exists
	_, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Check if user already has active linking codes (limit to prevent abuse)
	activeCodes, err := s.linkingCodeRepo.GetActiveByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check active codes: %w", err)
	}

	// Limit user to 3 active linking codes maximum
	if len(activeCodes) >= 3 {
		return nil, fmt.Errorf("maximum number of active linking codes reached (3)")
	}

	// Create new linking code
	linkingCode, err := entities.NewLinkingCode(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to create linking code: %w", err)
	}

	// Validate and store
	if err := linkingCode.Validate(); err != nil {
		return nil, fmt.Errorf("invalid linking code: %w", err)
	}

	if err := s.linkingCodeRepo.Create(ctx, linkingCode); err != nil {
		return nil, fmt.Errorf("failed to store linking code: %w", err)
	}

	return linkingCode, nil
}

// ValidateCode validates a linking code and returns the associated user
func (s *linkingCodeService) ValidateCode(ctx context.Context, code string) (*entities.LinkingCode, error) {
	linkingCode, err := s.linkingCodeRepo.GetByCode(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("linking code not found: %w", err)
	}

	if !linkingCode.IsValid() {
		return nil, fmt.Errorf("linking code is expired or already used")
	}

	return linkingCode, nil
}

// UseCode marks a linking code as used and returns the user
func (s *linkingCodeService) UseCode(ctx context.Context, code string) (*entities.LinkingCode, error) {
	// Validate the code first
	linkingCode, err := s.ValidateCode(ctx, code)
	if err != nil {
		return nil, err
	}

	// Mark as used
	linkingCode.MarkAsUsed()

	// Update in database
	if err := s.linkingCodeRepo.Update(ctx, linkingCode); err != nil {
		return nil, fmt.Errorf("failed to mark linking code as used: %w", err)
	}

	return linkingCode, nil
}

// GetUserCodes retrieves all active linking codes for a user
func (s *linkingCodeService) GetUserCodes(ctx context.Context, userID uuid.UUID) ([]*entities.LinkingCode, error) {
	return s.linkingCodeRepo.GetActiveByUserID(ctx, userID)
}

// RevokeCode revokes a specific linking code
func (s *linkingCodeService) RevokeCode(ctx context.Context, codeID uuid.UUID) error {
	return s.linkingCodeRepo.Delete(ctx, codeID)
}

// RevokeUserCodes revokes all linking codes for a user
func (s *linkingCodeService) RevokeUserCodes(ctx context.Context, userID uuid.UUID) error {
	// Get all user codes
	codes, err := s.linkingCodeRepo.GetByUserID(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to get user codes: %w", err)
	}

	// Delete each code
	for _, code := range codes {
		if err := s.linkingCodeRepo.Delete(ctx, code.ID); err != nil {
			return fmt.Errorf("failed to delete linking code %s: %w", code.ID, err)
		}
	}

	return nil
}

// CleanupExpiredCodes removes all expired linking codes from the system
func (s *linkingCodeService) CleanupExpiredCodes(ctx context.Context) error {
	return s.linkingCodeRepo.CleanupExpired(ctx)
}

// Helper method to cleanup expired codes automatically (can be called periodically)
func (s *linkingCodeService) StartPeriodicCleanup(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := s.CleanupExpiredCodes(ctx); err != nil {
				// Log error but don't stop the cleanup process
				// In production, use a proper logger
				fmt.Printf("Failed to cleanup expired linking codes: %v\n", err)
			}
		}
	}
}
