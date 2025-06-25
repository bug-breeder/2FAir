package entities

import (
	"database/sql/driver"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

// EncryptedTOTPSeed represents an encrypted TOTP seed with searchable metadata
type EncryptedTOTPSeed struct {
	ID         uuid.UUID `json:"id" db:"id"`
	UserID     uuid.UUID `json:"userId" db:"user_id"`
	KeyVersion int       `json:"keyVersion" db:"key_version"`

	// Encrypted payload (AES-GCM)
	Ciphertext []byte `json:"ciphertext" db:"ciphertext"` // AES-GCM encrypted TOTP seed + metadata
	IV         []byte `json:"iv" db:"iv"`                 // AES-GCM initialization vector (96 bits)
	AuthTag    []byte `json:"authTag" db:"auth_tag"`      // AES-GCM authentication tag

	// Searchable metadata (never encrypted for UX)
	Issuer      string         `json:"issuer" db:"issuer" validate:"required,max=255"`
	AccountName string         `json:"accountName" db:"account_name" validate:"required,max=255"`
	IconURL     *string        `json:"iconUrl,omitempty" db:"icon_url"`
	Tags        pq.StringArray `json:"tags" db:"tags"`

	// Timestamps and sync
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
	SyncedAt  time.Time `json:"syncedAt" db:"synced_at"`
}

// EncryptedData represents the encrypted components of a TOTP seed
type EncryptedData struct {
	Ciphertext []byte `json:"ciphertext"`
	IV         []byte `json:"iv"`
	AuthTag    []byte `json:"authTag"`
}

// NewEncryptedTOTPSeed creates a new encrypted TOTP seed
func NewEncryptedTOTPSeed(userID uuid.UUID, keyVersion int, issuer, accountName string, encryptedData EncryptedData) *EncryptedTOTPSeed {
	now := time.Now()
	return &EncryptedTOTPSeed{
		ID:          uuid.New(),
		UserID:      userID,
		KeyVersion:  keyVersion,
		Ciphertext:  encryptedData.Ciphertext,
		IV:          encryptedData.IV,
		AuthTag:     encryptedData.AuthTag,
		Issuer:      issuer,
		AccountName: accountName,
		Tags:        pq.StringArray{},
		CreatedAt:   now,
		UpdatedAt:   now,
		SyncedAt:    now,
	}
}

// Validate validates the encrypted TOTP seed entity
func (e *EncryptedTOTPSeed) Validate() error {
	if e.UserID == uuid.Nil {
		return ErrInvalidTOTPSeed
	}
	if e.KeyVersion < 1 {
		return ErrInvalidTOTPSeed
	}
	if len(e.Ciphertext) == 0 {
		return ErrInvalidTOTPSeed
	}
	if len(e.IV) != 12 { // AES-GCM IV should be 96 bits (12 bytes)
		return ErrInvalidTOTPSeed
	}
	if len(e.AuthTag) != 16 { // AES-GCM auth tag should be 128 bits (16 bytes)
		return ErrInvalidTOTPSeed
	}
	if strings.TrimSpace(e.Issuer) == "" {
		return ErrInvalidTOTPSeed
	}
	if strings.TrimSpace(e.AccountName) == "" {
		return ErrInvalidTOTPSeed
	}
	return nil
}

// UpdateEncryption updates the encrypted data for the TOTP seed
func (e *EncryptedTOTPSeed) UpdateEncryption(encryptedData EncryptedData, keyVersion int) {
	e.Ciphertext = encryptedData.Ciphertext
	e.IV = encryptedData.IV
	e.AuthTag = encryptedData.AuthTag
	e.KeyVersion = keyVersion
	e.UpdatedAt = time.Now()
}

// UpdateMetadata updates the searchable metadata
func (e *EncryptedTOTPSeed) UpdateMetadata(issuer, accountName string, iconURL *string, tags []string) {
	e.Issuer = issuer
	e.AccountName = accountName
	e.IconURL = iconURL
	e.Tags = pq.StringArray(tags)
	e.UpdatedAt = time.Now()
}

// GetEncryptedData returns the encrypted data components
func (e *EncryptedTOTPSeed) GetEncryptedData() EncryptedData {
	return EncryptedData{
		Ciphertext: e.Ciphertext,
		IV:         e.IV,
		AuthTag:    e.AuthTag,
	}
}

// AddTag adds a tag to the TOTP seed
func (e *EncryptedTOTPSeed) AddTag(tag string) {
	tag = strings.TrimSpace(tag)
	if tag == "" {
		return
	}

	// Check if tag already exists
	for _, existingTag := range e.Tags {
		if existingTag == tag {
			return
		}
	}

	e.Tags = append(e.Tags, tag)
	e.UpdatedAt = time.Now()
}

// RemoveTag removes a tag from the TOTP seed
func (e *EncryptedTOTPSeed) RemoveTag(tag string) {
	for i, existingTag := range e.Tags {
		if existingTag == tag {
			e.Tags = append(e.Tags[:i], e.Tags[i+1:]...)
			e.UpdatedAt = time.Now()
			break
		}
	}
}

// SetTags sets all tags for the TOTP seed
func (e *EncryptedTOTPSeed) SetTags(tags []string) {
	// Clean and deduplicate tags
	cleanTags := make([]string, 0, len(tags))
	seen := make(map[string]bool)

	for _, tag := range tags {
		tag = strings.TrimSpace(tag)
		if tag != "" && !seen[tag] {
			cleanTags = append(cleanTags, tag)
			seen[tag] = true
		}
	}

	e.Tags = pq.StringArray(cleanTags)
	e.UpdatedAt = time.Now()
}

// MarkSynced updates the synced timestamp
func (e *EncryptedTOTPSeed) MarkSynced() {
	e.SyncedAt = time.Now()
}

// HasTag checks if the TOTP seed has a specific tag
func (e *EncryptedTOTPSeed) HasTag(tag string) bool {
	for _, existingTag := range e.Tags {
		if existingTag == tag {
			return true
		}
	}
	return false
}

// MatchesQuery checks if the TOTP seed matches a search query
func (e *EncryptedTOTPSeed) MatchesQuery(query string) bool {
	query = strings.ToLower(strings.TrimSpace(query))
	if query == "" {
		return true
	}

	// Search in issuer
	if strings.Contains(strings.ToLower(e.Issuer), query) {
		return true
	}

	// Search in account name
	if strings.Contains(strings.ToLower(e.AccountName), query) {
		return true
	}

	// Search in tags
	for _, tag := range e.Tags {
		if strings.Contains(strings.ToLower(tag), query) {
			return true
		}
	}

	return false
}

// Ensure pq.StringArray implements the necessary interfaces
var _ driver.Valuer = (*pq.StringArray)(nil)
