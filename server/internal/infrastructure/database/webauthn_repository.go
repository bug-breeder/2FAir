package database

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/bug-breeder/2fair/server/internal/domain/entities"
	"github.com/bug-breeder/2fair/server/internal/domain/interfaces"
	db "github.com/bug-breeder/2fair/server/internal/infrastructure/database/sqlc"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type webAuthnCredentialRepository struct {
	db      *DB
	queries *db.Queries
}

// NewWebAuthnCredentialRepository creates a new WebAuthn credential repository
func NewWebAuthnCredentialRepository(database *DB) interfaces.WebAuthnCredentialRepository {
	return &webAuthnCredentialRepository{
		db:      database,
		queries: db.New(database.Pool),
	}
}

// Create stores a new WebAuthn credential
func (r *webAuthnCredentialRepository) Create(ctx context.Context, credential *entities.WebAuthnCredential) error {
	// Convert AAGUID from *uuid.UUID to pgtype.UUID
	var aaguid pgtype.UUID
	if credential.AAGUID != nil {
		aaguid = pgtype.UUID{Bytes: *credential.AAGUID, Valid: true}
	}

	// Convert attachment string to pgtype.Text
	var attachment pgtype.Text
	if credential.Attachment != "" {
		attachment = pgtype.Text{String: credential.Attachment, Valid: true}
	}

	// Ensure transport is never empty to avoid database NULL constraint violation
	transport := credential.Transport
	if len(transport) == 0 {
		transport = []string{"internal"}
	}

	params := db.CreateWebAuthnCredentialParams{
		UserID:          pgtype.UUID{Bytes: credential.UserID, Valid: true},
		CredentialID:    credential.CredentialID,
		PublicKey:       credential.PublicKey,
		AttestationType: "none", // Default attestation type
		Transport:       transport,
		Flags:           []byte{},     // Default empty flags
		Authenticator:   []byte(`{}`), // Default empty JSON
		DeviceName:      pgtype.Text{String: "Default Device", Valid: true},
		Aaguid:          aaguid,
		CloneWarning:    credential.CloneWarning,
		SignCount:       int64(credential.SignCount),
		Attachment:      attachment,
		BackupEligible:  credential.BackupEligible,
		BackupState:     credential.BackupState,
	}

	_, err := r.queries.CreateWebAuthnCredential(ctx, params)
	return err
}

// GetByID retrieves a WebAuthn credential by credential ID
func (r *webAuthnCredentialRepository) GetByID(ctx context.Context, id uuid.UUID) (*entities.WebAuthnCredential, error) {
	// Convert UUID to bytes for the query
	credentialID := id[:]
	cred, err := r.queries.GetWebAuthnCredentialByID(ctx, credentialID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, entities.ErrCredentialNotFound
		}
		return nil, fmt.Errorf("failed to get WebAuthn credential: %w", err)
	}

	return r.convertToEntity(cred), nil
}

// GetByUserID retrieves all WebAuthn credentials for a user
func (r *webAuthnCredentialRepository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]*entities.WebAuthnCredential, error) {
	creds, err := r.queries.GetWebAuthnCredentialsByUserID(ctx, pgtype.UUID{Bytes: userID, Valid: true})
	if err != nil {
		return nil, fmt.Errorf("failed to get WebAuthn credentials: %w", err)
	}

	entities := make([]*entities.WebAuthnCredential, len(creds))
	for i, cred := range creds {
		entities[i] = r.convertToEntity(cred)
	}

	return entities, nil
}

// GetByCredentialID retrieves a WebAuthn credential by credential ID
func (r *webAuthnCredentialRepository) GetByCredentialID(ctx context.Context, credentialID []byte) (*entities.WebAuthnCredential, error) {
	row, err := r.queries.GetWebAuthnCredentialByID(ctx, credentialID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, entities.ErrCredentialNotFound
		}
		return nil, fmt.Errorf("failed to get WebAuthn credential by credential ID: %w", err)
	}

	return r.convertToEntity(row), nil
}

// Update updates an existing WebAuthn credential
func (r *webAuthnCredentialRepository) Update(ctx context.Context, credential *entities.WebAuthnCredential) error {
	// Update last used timestamp
	err := r.queries.UpdateWebAuthnCredentialLastUsed(ctx, credential.CredentialID)
	if err != nil {
		return fmt.Errorf("failed to update WebAuthn credential: %w", err)
	}
	return nil
}

// Delete deletes a WebAuthn credential
func (r *webAuthnCredentialRepository) Delete(ctx context.Context, credentialID []byte, userID uuid.UUID) error {
	err := r.queries.DeleteWebAuthnCredential(ctx, db.DeleteWebAuthnCredentialParams{
		CredentialID: credentialID,
		UserID:       pgtype.UUID{Bytes: userID, Valid: true},
	})
	if err != nil {
		return fmt.Errorf("failed to delete WebAuthn credential: %w", err)
	}
	return nil
}

// ExistsByCredentialID checks if a credential exists by credential ID
func (r *webAuthnCredentialRepository) ExistsByCredentialID(ctx context.Context, credentialID []byte) (bool, error) {
	_, err := r.queries.GetWebAuthnCredentialByID(ctx, credentialID)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}
		return false, fmt.Errorf("failed to check if WebAuthn credential exists: %w", err)
	}
	return true, nil
}

// UpdateSignCount updates the sign count and last used timestamp
func (r *webAuthnCredentialRepository) UpdateSignCount(ctx context.Context, credentialID []byte, signCount uint64) error {
	params := db.UpdateWebAuthnCredentialSignCountParams{
		CredentialID: credentialID,
		SignCount:    int64(signCount),
	}
	return r.queries.UpdateWebAuthnCredentialSignCount(ctx, params)
}

// UpdateCloneWarning updates the clone warning flag
func (r *webAuthnCredentialRepository) UpdateCloneWarning(ctx context.Context, credentialID []byte, cloneWarning bool) error {
	params := db.UpdateWebAuthnCredentialCloneWarningParams{
		CredentialID: credentialID,
		CloneWarning: cloneWarning,
	}
	return r.queries.UpdateWebAuthnCredentialCloneWarning(ctx, params)
}

// convertToEntity converts a database WebAuthn credential to a domain entity
func (r *webAuthnCredentialRepository) convertToEntity(cred db.WebauthnCredential) *entities.WebAuthnCredential {
	entity := &entities.WebAuthnCredential{
		ID:             uuid.UUID(cred.ID.Bytes),
		UserID:         uuid.UUID(cred.UserID.Bytes),
		CredentialID:   cred.CredentialID,
		PublicKey:      cred.PublicKey,
		Transport:      cred.Transport,
		CreatedAt:      cred.CreatedAt.Time,
		CloneWarning:   cred.CloneWarning,
		SignCount:      uint64(cred.SignCount),
		BackupEligible: cred.BackupEligible,
		BackupState:    cred.BackupState,
	}

	// Handle optional AAGUID
	if cred.Aaguid.Valid {
		aaguid := uuid.UUID(cred.Aaguid.Bytes)
		entity.AAGUID = &aaguid
	}

	// Handle optional attachment
	if cred.Attachment.Valid {
		entity.Attachment = cred.Attachment.String
	}

	// Handle optional last used timestamp
	if cred.LastUsedAt.Valid {
		entity.LastUsedAt = &cred.LastUsedAt.Time
	}

	return entity
}
