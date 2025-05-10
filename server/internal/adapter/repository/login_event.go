package repository

import (
	"context"

	"github.com/bug-breeder/2fair/server/internal/domain/models"
)

type LoginEventRepository interface {
	GetLoginEventByID(ctx context.Context, userID int, sessionID int) (*models.LoginEvent, error)
	AddLoginEvent(ctx context.Context, loginEvent *models.LoginEvent) (int, error)
	RemoveLoginEvent(ctx context.Context, userID int, sessionID int) error
	ListLoginEvents(ctx context.Context, userID int, limit int) ([]models.LoginEvent, error)
}
