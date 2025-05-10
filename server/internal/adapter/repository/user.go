package repository

import (
	"context"

	"github.com/bug-breeder/2fair/server/internal/domain/models"
)

type UserRepository interface {
	FindByID(ctx context.Context, id int) (*models.User, error)
	FindByEmail(ctx context.Context, email string) (*models.User, error)
	CreateUser(ctx context.Context, user *models.User) (int, error)
}
