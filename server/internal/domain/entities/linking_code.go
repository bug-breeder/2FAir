package entities

import (
	"crypto/rand"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

// LinkingCode represents a temporary code for linking additional devices
type LinkingCode struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	UserID    uuid.UUID  `json:"userId" db:"user_id"`
	Code      string     `json:"code" db:"code"`
	IsUsed    bool       `json:"isUsed" db:"is_used"`
	ExpiresAt time.Time  `json:"expiresAt" db:"expires_at"`
	UsedAt    *time.Time `json:"usedAt,omitempty" db:"used_at"`
	CreatedAt time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time  `json:"updatedAt" db:"updated_at"`
}

// NewLinkingCode creates a new linking code for a user
func NewLinkingCode(userID uuid.UUID) (*LinkingCode, error) {
	code, err := generateLinkingCode()
	if err != nil {
		return nil, fmt.Errorf("failed to generate linking code: %w", err)
	}

	now := time.Now()
	return &LinkingCode{
		ID:        uuid.New(),
		UserID:    userID,
		Code:      code,
		IsUsed:    false,
		ExpiresAt: now.Add(15 * time.Minute), // 15 minute expiry
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

// generateLinkingCode generates a human-readable linking code
func generateLinkingCode() (string, error) {
	// Generate 6 random bytes
	bytes := make([]byte, 6)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	// Convert to uppercase letters and numbers (base32-like)
	chars := "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
	code := make([]byte, 10)
	for i := range code {
		code[i] = chars[int(bytes[i%6])%len(chars)]
	}

	// Format as XXXX-XXXX-XX
	codeStr := string(code)
	return fmt.Sprintf("%s-%s-%s", codeStr[:4], codeStr[4:8], codeStr[8:]), nil
}

// IsExpired checks if the linking code is expired
func (lc *LinkingCode) IsExpired() bool {
	return time.Now().After(lc.ExpiresAt)
}

// IsValid checks if the linking code is valid (not used and not expired)
func (lc *LinkingCode) IsValid() bool {
	return !lc.IsUsed && !lc.IsExpired()
}

// MarkAsUsed marks the linking code as used
func (lc *LinkingCode) MarkAsUsed() {
	now := time.Now()
	lc.IsUsed = true
	lc.UsedAt = &now
	lc.UpdatedAt = now
}

// Validate validates the linking code entity
func (lc *LinkingCode) Validate() error {
	if lc.UserID == uuid.Nil {
		return fmt.Errorf("invalid user ID")
	}
	if lc.Code == "" {
		return fmt.Errorf("linking code cannot be empty")
	}
	if len(lc.Code) != 12 || !isValidLinkingCodeFormat(lc.Code) {
		return fmt.Errorf("invalid linking code format")
	}
	return nil
}

// isValidLinkingCodeFormat checks if the code matches XXXX-XXXX-XX format
func isValidLinkingCodeFormat(code string) bool {
	parts := strings.Split(code, "-")
	if len(parts) != 3 {
		return false
	}
	if len(parts[0]) != 4 || len(parts[1]) != 4 || len(parts[2]) != 2 {
		return false
	}

	validChars := "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
	for _, part := range parts {
		for _, char := range part {
			if !strings.ContainsRune(validChars, char) {
				return false
			}
		}
	}
	return true
}
