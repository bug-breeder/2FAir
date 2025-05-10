package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/bug-breeder/2fair/server/internal/adapter/repository"
	"github.com/bug-breeder/2fair/server/internal/adapter/repository/postgres/generated"
	sqlc "github.com/bug-breeder/2fair/server/internal/adapter/repository/postgres/generated"
	"github.com/bug-breeder/2fair/server/internal/domain/models"
	"github.com/jackc/pgx/v5"
)

// Ensure LoginEventRepository implements repository.LoginEventRepository interface
var _ repository.LoginEventRepository = (*LoginEventRepository)(nil)

// LoginEventRepository handles login event data access to PostgreSQL database
type LoginEventRepository struct {
	db      *PostgresDB
	queries *sqlc.Queries
}

// NewPostgresLoginEventRepository creates a new login event repository instance
func NewPostgresLoginEventRepository(db *PostgresDB) *LoginEventRepository {
	return &LoginEventRepository{
		db:      db,
		queries: sqlc.New(db.Pool),
	}
}

// GetLoginEventByID retrieves a login event by its ID
func (r *LoginEventRepository) GetLoginEventByID(ctx context.Context, userID int, sessionID int) (*models.LoginEvent, error) {
	event, err := r.queries.GetLoginEventByID(ctx, generated.GetLoginEventByIDParams{
		ID:     int32(sessionID),
		UserID: int32(userID),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("login event not found with ID: %d for user: %d", sessionID, userID)
		}
		return nil, fmt.Errorf("error finding login event: %w", err)
	}

	return &models.LoginEvent{
		ID:        int(event.ID),
		UserID:    int(event.UserID),
		Timestamp: event.Timestamp,
		IPAddress: event.IpAddress,
		UserAgent: event.UserAgent,
	}, nil
}

// AddLoginEvent adds a new login event
func (r *LoginEventRepository) AddLoginEvent(ctx context.Context, loginEvent *models.LoginEvent) (int, error) {
	result, err := r.queries.AddLoginEvent(ctx, generated.AddLoginEventParams{
		UserID:    int32(loginEvent.UserID),
		IpAddress: loginEvent.IPAddress,
		UserAgent: loginEvent.UserAgent,
	})
	if err != nil {
		return 0, fmt.Errorf("error adding login event: %w", err)
	}

	return int(result.ID), nil
}

// RemoveLoginEvent removes a login event
func (r *LoginEventRepository) RemoveLoginEvent(ctx context.Context, userID int, sessionID int) error {
	err := r.queries.RemoveLoginEvent(ctx, generated.RemoveLoginEventParams{
		ID:     int32(sessionID),
		UserID: int32(userID),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("login event not found with ID: %d for user: %d", sessionID, userID)
		}
		return fmt.Errorf("error removing login event: %w", err)
	}

	return nil
}

// ListLoginEvents lists login events for a user with pagination
func (r *LoginEventRepository) ListLoginEvents(ctx context.Context, userID int, limit int) ([]models.LoginEvent, error) {
	events, err := r.queries.ListLoginEvents(ctx, generated.ListLoginEventsParams{
		UserID: int32(userID),
		Limit:  int32(limit),
	})
	if err != nil {
		return nil, fmt.Errorf("error listing login events: %w", err)
	}

	result := make([]models.LoginEvent, len(events))
	for i, event := range events {
		result[i] = models.LoginEvent{
			ID:        int(event.ID),
			UserID:    int(event.UserID),
			Timestamp: event.Timestamp,
			IPAddress: event.IpAddress,
			UserAgent: event.UserAgent,
		}
	}

	return result, nil
}
