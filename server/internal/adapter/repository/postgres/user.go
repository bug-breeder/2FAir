package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/bug-breeder/2fair/server/internal/adapter/repository"
	sqlc "github.com/bug-breeder/2fair/server/internal/adapter/repository/postgres/generated"
	"github.com/bug-breeder/2fair/server/internal/domain/models"
	"github.com/jackc/pgx/v5"
)

// Ensure UserRepository implements repository.UserRepository interface
var _ repository.UserRepository = (*UserRepository)(nil)

// UserRepository handles user data access to PostgreSQL database
type UserRepository struct {
	db      *PostgresDB
	queries *sqlc.Queries
}

// NewPostgresUserRepository creates a new user repository instance
func NewPostgresUserRepository(db *PostgresDB) *UserRepository {
	return &UserRepository{
		db:      db,
		queries: sqlc.New(db.Pool),
	}
}

// FindByID finds a user by ID
func (r *UserRepository) FindByID(ctx context.Context, id int) (*models.User, error) {
	user, err := r.queries.GetUserByID(ctx, int32(id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("user not found with ID: %d", id)
		}
		return nil, fmt.Errorf("error finding user by ID: %w", err)
	}

	return &models.User{
		ID:         int(user.ID),
		Name:       user.Name,
		Email:      user.Email,
		Provider:   user.Provider,
		ProviderID: user.ProviderID,
		CreatedAt:  user.CreatedAt,
	}, nil
}

// FindByEmail finds a user by email
func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	user, err := r.queries.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("user not found with email: %s", email)
		}
		return nil, fmt.Errorf("error finding user by email: %w", err)
	}

	return &models.User{
		ID:         int(user.ID),
		Name:       user.Name,
		Email:      user.Email,
		Provider:   user.Provider,
		ProviderID: user.ProviderID,
		CreatedAt:  user.CreatedAt,
	}, nil
}

// CreateUser creates a new user
func (r *UserRepository) CreateUser(ctx context.Context, user *models.User) (int, error) {
	params := sqlc.CreateUserParams{
		Name:       user.Name,
		Email:      user.Email,
		Provider:   user.Provider,
		ProviderID: user.ProviderID,
	}

	result, err := r.queries.CreateUser(ctx, params)
	if err != nil {
		return 0, fmt.Errorf("error creating user: %w", err)
	}

	return int(result.ID), nil
}
