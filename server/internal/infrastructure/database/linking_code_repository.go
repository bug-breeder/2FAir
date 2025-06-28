package database

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/bug-breeder/2fair/server/internal/domain/entities"
	"github.com/bug-breeder/2fair/server/internal/domain/interfaces"
)

// LinkingCodeRepository implements the domain linking code repository interface
type LinkingCodeRepository struct {
	dbConn *DB
}

// NewLinkingCodeRepository creates a new linking code repository
func NewLinkingCodeRepository(dbConn *DB) interfaces.LinkingCodeRepository {
	return &LinkingCodeRepository{
		dbConn: dbConn,
	}
}

// Create creates a new linking code
func (r *LinkingCodeRepository) Create(ctx context.Context, linkingCode *entities.LinkingCode) error {
	query := `
		INSERT INTO linking_codes (id, user_id, code, is_used, expires_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`

	_, err := r.dbConn.Pool.Exec(ctx, query,
		convertUUIDToPG(linkingCode.ID),
		convertUUIDToPG(linkingCode.UserID),
		linkingCode.Code,
		linkingCode.IsUsed,
		linkingCode.ExpiresAt,
		linkingCode.CreatedAt,
		linkingCode.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create linking code: %w", err)
	}

	return nil
}

// GetByCode retrieves a linking code by its code
func (r *LinkingCodeRepository) GetByCode(ctx context.Context, code string) (*entities.LinkingCode, error) {
	query := `
		SELECT id, user_id, code, is_used, expires_at, used_at, created_at, updated_at
		FROM linking_codes
		WHERE code = $1`

	var linkingCode entities.LinkingCode
	var usedAt pgtype.Timestamptz

	err := r.dbConn.Pool.QueryRow(ctx, query, code).Scan(
		&linkingCode.ID,
		&linkingCode.UserID,
		&linkingCode.Code,
		&linkingCode.IsUsed,
		&linkingCode.ExpiresAt,
		&usedAt,
		&linkingCode.CreatedAt,
		&linkingCode.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("linking code not found")
		}
		return nil, fmt.Errorf("failed to get linking code by code: %w", err)
	}

	// Convert nullable timestamp
	if usedAt.Valid {
		linkingCode.UsedAt = &usedAt.Time
	}

	return &linkingCode, nil
}

// GetByUserID retrieves all linking codes for a user
func (r *LinkingCodeRepository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]*entities.LinkingCode, error) {
	query := `
		SELECT id, user_id, code, is_used, expires_at, used_at, created_at, updated_at
		FROM linking_codes
		WHERE user_id = $1
		ORDER BY created_at DESC`

	rows, err := r.dbConn.Pool.Query(ctx, query, convertUUIDToPG(userID))
	if err != nil {
		return nil, fmt.Errorf("failed to get linking codes by user ID: %w", err)
	}
	defer rows.Close()

	var linkingCodes []*entities.LinkingCode
	for rows.Next() {
		var linkingCode entities.LinkingCode
		var usedAt pgtype.Timestamptz

		err := rows.Scan(
			&linkingCode.ID,
			&linkingCode.UserID,
			&linkingCode.Code,
			&linkingCode.IsUsed,
			&linkingCode.ExpiresAt,
			&usedAt,
			&linkingCode.CreatedAt,
			&linkingCode.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan linking code: %w", err)
		}

		// Convert nullable timestamp
		if usedAt.Valid {
			linkingCode.UsedAt = &usedAt.Time
		}

		linkingCodes = append(linkingCodes, &linkingCode)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate linking codes: %w", err)
	}

	return linkingCodes, nil
}

// Update updates an existing linking code
func (r *LinkingCodeRepository) Update(ctx context.Context, linkingCode *entities.LinkingCode) error {
	query := `
		UPDATE linking_codes
		SET is_used = $2, used_at = $3, updated_at = $4
		WHERE id = $1`

	var usedAt pgtype.Timestamptz
	if linkingCode.UsedAt != nil {
		usedAt = pgtype.Timestamptz{Time: *linkingCode.UsedAt, Valid: true}
	}

	_, err := r.dbConn.Pool.Exec(ctx, query,
		convertUUIDToPG(linkingCode.ID),
		linkingCode.IsUsed,
		usedAt,
		linkingCode.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to update linking code: %w", err)
	}

	return nil
}

// Delete deletes a linking code
func (r *LinkingCodeRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM linking_codes WHERE id = $1`

	_, err := r.dbConn.Pool.Exec(ctx, query, convertUUIDToPG(id))
	if err != nil {
		return fmt.Errorf("failed to delete linking code: %w", err)
	}

	return nil
}

// CleanupExpired removes all expired linking codes
func (r *LinkingCodeRepository) CleanupExpired(ctx context.Context) error {
	query := `DELETE FROM linking_codes WHERE expires_at < $1`

	result, err := r.dbConn.Pool.Exec(ctx, query, time.Now())
	if err != nil {
		return fmt.Errorf("failed to cleanup expired linking codes: %w", err)
	}

	// Log how many were deleted (optional)
	_ = result.RowsAffected()

	return nil
}

// GetActiveByUserID retrieves all active (valid) linking codes for a user
func (r *LinkingCodeRepository) GetActiveByUserID(ctx context.Context, userID uuid.UUID) ([]*entities.LinkingCode, error) {
	query := `
		SELECT id, user_id, code, is_used, expires_at, used_at, created_at, updated_at
		FROM linking_codes
		WHERE user_id = $1 AND is_used = FALSE AND expires_at > $2
		ORDER BY created_at DESC`

	rows, err := r.dbConn.Pool.Query(ctx, query, convertUUIDToPG(userID), time.Now())
	if err != nil {
		return nil, fmt.Errorf("failed to get active linking codes by user ID: %w", err)
	}
	defer rows.Close()

	var linkingCodes []*entities.LinkingCode
	for rows.Next() {
		var linkingCode entities.LinkingCode
		var usedAt pgtype.Timestamptz

		err := rows.Scan(
			&linkingCode.ID,
			&linkingCode.UserID,
			&linkingCode.Code,
			&linkingCode.IsUsed,
			&linkingCode.ExpiresAt,
			&usedAt,
			&linkingCode.CreatedAt,
			&linkingCode.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan active linking code: %w", err)
		}

		// Convert nullable timestamp
		if usedAt.Valid {
			linkingCode.UsedAt = &usedAt.Time
		}

		linkingCodes = append(linkingCodes, &linkingCode)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate active linking codes: %w", err)
	}

	return linkingCodes, nil
}
