package database

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	db "github.com/bug-breeder/2fair/server/internal/infrastructure/database/sqlc"
	"github.com/bug-breeder/2fair/server/internal/domain/entities"
	"github.com/bug-breeder/2fair/server/internal/domain/interfaces"
)

// UserRepository implements the domain user repository interface
type UserRepository struct {
	dbConn  *DB
	queries *db.Queries
}

// NewUserRepository creates a new user repository
func NewUserRepository(dbConn *DB) interfaces.UserRepository {
	return &UserRepository{
		dbConn:  dbConn,
		queries: db.New(dbConn.Pool),
	}
}

// Create creates a new user
func (r *UserRepository) Create(ctx context.Context, user *entities.User) error {
	// Use the generated CreateUser query which returns a User
	dbUser, err := r.queries.CreateUser(ctx, db.CreateUserParams{
		Username:    user.Username,
		Email:       user.Email,
		DisplayName: user.DisplayName,
	})
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	// Update the user entity with generated values
	user.ID = convertPGUUID(dbUser.ID)
	user.CreatedAt = convertPGTimestamp(dbUser.CreatedAt)
	user.UpdatedAt = convertPGTimestamp(dbUser.UpdatedAt)
	user.IsActive = convertPGBool(dbUser.IsActive)

	return nil
}

// GetByID retrieves a user by ID
func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*entities.User, error) {
	pgID := convertUUIDToPG(id)
	row, err := r.queries.GetUserByID(ctx, pgID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, entities.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by ID: %w", err)
	}

	return convertDBUserToEntity(row), nil
}

// GetByEmail retrieves a user by email
func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*entities.User, error) {
	row, err := r.queries.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, entities.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	return convertDBUserToEntity(row), nil
}

// GetByUsername retrieves a user by username
func (r *UserRepository) GetByUsername(ctx context.Context, username string) (*entities.User, error) {
	row, err := r.queries.GetUserByUsername(ctx, username)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, entities.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by username: %w", err)
	}

	return convertDBUserToEntity(row), nil
}

// Update updates an existing user
func (r *UserRepository) Update(ctx context.Context, user *entities.User) error {
	// Use the generated UpdateUser query
	dbUser, err := r.queries.UpdateUser(ctx, db.UpdateUserParams{
		ID:          convertUUIDToPG(user.ID),
		Username:    pgtype.Text{String: user.Username, Valid: true},
		Email:       pgtype.Text{String: user.Email, Valid: true},
		DisplayName: pgtype.Text{String: user.DisplayName, Valid: true},
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entities.ErrUserNotFound
		}
		return fmt.Errorf("failed to update user: %w", err)
	}

	// Update the entity with the returned values
	user.UpdatedAt = convertPGTimestamp(dbUser.UpdatedAt)

	return nil
}

// UpdateLastLogin updates the user's last login timestamp
func (r *UserRepository) UpdateLastLogin(ctx context.Context, userID uuid.UUID) error {
	pgID := convertUUIDToPG(userID)
	err := r.queries.UpdateUserLastLogin(ctx, pgID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entities.ErrUserNotFound
		}
		return fmt.Errorf("failed to update last login: %w", err)
	}

	return nil
}

// Deactivate marks a user as inactive (soft delete)
func (r *UserRepository) Deactivate(ctx context.Context, userID uuid.UUID) error {
	pgID := convertUUIDToPG(userID)
	err := r.queries.DeactivateUser(ctx, pgID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entities.ErrUserNotFound
		}
		return fmt.Errorf("failed to deactivate user: %w", err)
	}

	return nil
}

// ExistsByEmail checks if a user exists by email
func (r *UserRepository) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	_, err := r.queries.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, fmt.Errorf("failed to check user existence by email: %w", err)
	}
	return true, nil
}

// ExistsByUsername checks if a user exists by username
func (r *UserRepository) ExistsByUsername(ctx context.Context, username string) (bool, error) {
	_, err := r.queries.GetUserByUsername(ctx, username)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, fmt.Errorf("failed to check user existence by username: %w", err)
	}
	return true, nil
}

// Note: List and Count methods are not implemented yet as the SQLC queries are not generated
// These will be added in a future iteration when we have the proper queries

// Helper functions to convert between pgtype and Go types

func convertUUIDToPG(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{
		Bytes: id,
		Valid: true,
	}
}

func convertPGUUID(pgID pgtype.UUID) uuid.UUID {
	if !pgID.Valid {
		return uuid.Nil
	}
	return pgID.Bytes
}

func convertPGTimestamp(pgTime pgtype.Timestamptz) time.Time {
	if !pgTime.Valid {
		return time.Time{}
	}
	return pgTime.Time
}

func convertPGBool(pgBool pgtype.Bool) bool {
	if !pgBool.Valid {
		return false
	}
	return pgBool.Bool
}

func convertDBUserToEntity(dbUser db.User) *entities.User {
	user := &entities.User{
		ID:          convertPGUUID(dbUser.ID),
		Username:    dbUser.Username,
		Email:       dbUser.Email,
		DisplayName: dbUser.DisplayName,
		CreatedAt:   convertPGTimestamp(dbUser.CreatedAt),
		UpdatedAt:   convertPGTimestamp(dbUser.UpdatedAt),
		IsActive:    convertPGBool(dbUser.IsActive),
	}

	// Handle nullable last login timestamp
	if dbUser.LastLoginAt.Valid {
		loginTime := dbUser.LastLoginAt.Time
		user.LastLoginAt = &loginTime
	}

	return user
}
