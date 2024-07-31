package repository

import (
	"context"

	"github.com/bug-breeder/2fair/server/internal/domain/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserRepository interface {
	FindByID(ctx context.Context, id primitive.ObjectID) (*models.User, error)
	FindByEmail(ctx context.Context, email string) (*models.User, error)
	CreateUser(ctx context.Context, user *models.User) (primitive.ObjectID, error)
	UpdateLoginHistory(ctx context.Context, userID primitive.ObjectID, loginEvent models.LoginEvent) error
	RemoveLoginEvent(ctx context.Context, userID primitive.ObjectID, sessionID primitive.ObjectID) error
	FindLoginEventByID(ctx context.Context, userID primitive.ObjectID, sessionID primitive.ObjectID) error
}
