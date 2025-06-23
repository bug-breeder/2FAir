package database

import (
	"context"
	"database/sql"
	"fmt"

	db "github.com/bug-breeder/2fair/server/internal/adapter/database/sqlc"
	"github.com/bug-breeder/2fair/server/internal/domain/entities"
	"github.com/bug-breeder/2fair/server/internal/domain/repositories"
	"github.com/bug-breeder/2fair/server/internal/infrastructure/database"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type webAuthnCredentialRepository struct {
	db      *database.DB
	queries *db.Queries
}

// NewWebAuthnCredentialRepository creates a new WebAuthn credential repository
func NewWebAuthnCredentialRepository(database *database.DB) repositories.WebAuthnCredentialRepository {
	return &webAuthnCredentialRepository{
		db:      database,
		queries: db.New(database.Pool),
	}
}

// Create stores a new WebAuthn credential
func (r *webAuthnCredentialRepository) Create(ctx context.Context, credential *entities.WebAuthnCredential) error {
	params := db.CreateWebAuthnCredentialParams{
		UserID:         pgtype.UUID{Bytes: credential.UserID, Valid: true},
		CredentialID:   credential.CredentialID,
		PublicKey:      credential.PublicKey,
		CloneWarning:   pgtype.Bool{Bool: credential.CloneWarning, Valid: true},
		Transport:      credential.Transport,
		BackupEligible: pgtype.Bool{Bool: credential.BackupEligible, Valid: true},
		BackupState:    pgtype.Bool{Bool: credential.BackupState, Valid: true},
		SignCount:      pgtype.Int8{Int64: int64(credential.SignCount), Valid: true},
	}

	// Handle optional AAGUID
	if credential.AAGUID != nil {
		params.Aaguid = pgtype.UUID{Bytes: *credential.AAGUID, Valid: true}
	}

	// Handle optional attachment
	if credential.Attachment != "" {
		params.Attachment = pgtype.Text{String: credential.Attachment, Valid: true}
	}

	_, err := r.queries.CreateWebAuthnCredential(ctx, params)
	return err
}

// GetByID retrieves a WebAuthn credential by ID
func (r *webAuthnCredentialRepository) GetByID(ctx context.Context, id uuid.UUID) (*entities.WebAuthnCredential, error) {
	row, err := r.queries.GetWebAuthnCredentialByID(ctx, id[:])
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, entities.ErrCredentialNotFound
		}
		return nil, fmt.Errorf("failed to get WebAuthn credential: %w", err)
	}

	return r.mapRowToEntity(row), nil
}

// GetByUserID retrieves all WebAuthn credentials for a user
func (r *webAuthnCredentialRepository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]*entities.WebAuthnCredential, error) {
	rows, err := r.queries.GetWebAuthnCredentialsByUserID(ctx, pgtype.UUID{Bytes: userID, Valid: true})
	if err != nil {
		return nil, fmt.Errorf("failed to get WebAuthn credentials for user: %w", err)
	}

	credentials := make([]*entities.WebAuthnCredential, len(rows))
	for i, row := range rows {
		credentials[i] = r.mapRowToEntity(row)
	}

	return credentials, nil
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

	return r.mapRowToEntity(row), nil
}

// Update updates an existing WebAuthn credential (not fully implemented in SQLC, using sign count update for now)
func (r *webAuthnCredentialRepository) Update(ctx context.Context, credential *entities.WebAuthnCredential) error {
	// For now, just update the sign count which is the most common update
	return r.UpdateSignCount(ctx, credential.CredentialID, credential.SignCount)
}

// UpdateSignCount updates the sign count and last used timestamp
func (r *webAuthnCredentialRepository) UpdateSignCount(ctx context.Context, credentialID []byte, signCount uint64) error {
	params := db.UpdateWebAuthnCredentialSignCountParams{
		CredentialID: credentialID,
		SignCount:    pgtype.Int8{Int64: int64(signCount), Valid: true},
	}

	return r.queries.UpdateWebAuthnCredentialSignCount(ctx, params)
}

// UpdateCloneWarning updates the clone warning flag
func (r *webAuthnCredentialRepository) UpdateCloneWarning(ctx context.Context, credentialID []byte, cloneWarning bool) error {
	params := db.UpdateWebAuthnCredentialCloneWarningParams{
		CredentialID: credentialID,
		CloneWarning: pgtype.Bool{Bool: cloneWarning, Valid: true},
	}

	return r.queries.UpdateWebAuthnCredentialCloneWarning(ctx, params)
}

// Delete removes a WebAuthn credential
func (r *webAuthnCredentialRepository) Delete(ctx context.Context, credentialID []byte, userID uuid.UUID) error {
	params := db.DeleteWebAuthnCredentialParams{
		CredentialID: credentialID,
		UserID:       pgtype.UUID{Bytes: userID, Valid: true},
	}

	return r.queries.DeleteWebAuthnCredential(ctx, params)
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

// mapRowToEntity converts a database row to a WebAuthn credential entity
func (r *webAuthnCredentialRepository) mapRowToEntity(row db.WebauthnCredential) *entities.WebAuthnCredential {
	credential := &entities.WebAuthnCredential{
		ID:             uuid.UUID(row.ID.Bytes),
		UserID:         uuid.UUID(row.UserID.Bytes),
		CredentialID:   row.CredentialID,
		PublicKey:      row.PublicKey,
		CloneWarning:   row.CloneWarning.Bool,
		Transport:      row.Transport,
		BackupEligible: row.BackupEligible.Bool,
		BackupState:    row.BackupState.Bool,
		SignCount:      uint64(row.SignCount.Int64),
		CreatedAt:      row.CreatedAt.Time,
	}

	// Handle optional AAGUID
	if row.Aaguid.Valid {
		aaguid := uuid.UUID(row.Aaguid.Bytes)
		credential.AAGUID = &aaguid
	}

	// Handle optional attachment
	if row.Attachment.Valid {
		credential.Attachment = row.Attachment.String
	}

	// Handle optional last used timestamp
	if row.LastUsedAt.Valid {
		credential.LastUsedAt = &row.LastUsedAt.Time
	}

	return credential
}
