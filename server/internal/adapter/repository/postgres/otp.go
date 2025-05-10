package postgres

import (
	"context"
	"fmt"

	"github.com/bug-breeder/2fair/server/internal/adapter/repository"
	sqlc "github.com/bug-breeder/2fair/server/internal/adapter/repository/postgres/generated"
	"github.com/bug-breeder/2fair/server/internal/domain/models"
)

// Ensure OTPRepository implements repository.OTPRepository interface
var _ repository.OTPRepository = (*OTPRepository)(nil)

// OTPRepository handles OTP data access to PostgreSQL database
type OTPRepository struct {
	db      *PostgresDB
	queries *sqlc.Queries
}

// NewPostgresOTPRepository creates a new OTP repository instance
func NewPostgresOTPRepository(db *PostgresDB) *OTPRepository {
	return &OTPRepository{
		db:      db,
		queries: sqlc.New(db.Pool),
	}
}

// AddOTP adds a new OTP for a user
func (r *OTPRepository) AddOTP(ctx context.Context, userID int, otp *models.OTP) error {
	params := sqlc.AddOTPParams{
		UserID:    int32(userID),
		Issuer:    otp.Issuer,
		Label:     otp.Label,
		Secret:    otp.Secret,
		Algorithm: otp.Algorithm,
		Digits:    int32(otp.Digits),
		Period:    int32(otp.Period),
		Counter:   int32(otp.Counter),
		Method:    otp.Method,
		Active:    otp.Active,
	}

	_, err := r.queries.AddOTP(ctx, params)
	if err != nil {
		return fmt.Errorf("error adding OTP: %w", err)
	}

	return nil
}

// InactivateOTP marks an OTP as inactive
func (r *OTPRepository) InactivateOTP(ctx context.Context, userID, otpID int) error {
	params := sqlc.InactivateOTPParams{
		ID:     int32(otpID),
		UserID: int32(userID),
	}

	_, err := r.queries.InactivateOTP(ctx, params)
	if err != nil {
		return fmt.Errorf("error inactivating OTP: %w", err)
	}

	return nil
}

// EditOTP updates an existing OTP
func (r *OTPRepository) EditOTP(ctx context.Context, userID, otpID int, otp *models.OTP) error {
	params := sqlc.EditOTPParams{
		ID:        int32(otpID),
		UserID:    int32(userID),
		Label:     otp.Label,
		Algorithm: otp.Algorithm,
		Digits:    int32(otp.Digits),
		Method:    otp.Method,
		Period:    int32(otp.Period),
		Counter:   int32(otp.Counter),
	}

	_, err := r.queries.EditOTP(ctx, params)
	if err != nil {
		return fmt.Errorf("error updating OTP: %w", err)
	}

	return nil
}

// ListOTPs retrieves all active OTPs for a user
func (r *OTPRepository) ListOTPs(ctx context.Context, userID int) ([]models.OTP, error) {
	dbOTPs, err := r.queries.ListOTPs(ctx, int32(userID))
	if err != nil {
		return nil, fmt.Errorf("error listing OTPs: %w", err)
	}

	otps := make([]models.OTP, len(dbOTPs))
	for i, dbOTP := range dbOTPs {
		otps[i] = models.OTP{
			ID:        int(dbOTP.ID),
			UserID:    int(dbOTP.UserID),
			Issuer:    dbOTP.Issuer,
			Label:     dbOTP.Label,
			Secret:    dbOTP.Secret,
			Algorithm: dbOTP.Algorithm,
			Digits:    int(dbOTP.Digits),
			Counter:   int(dbOTP.Counter),
			Period:    int(dbOTP.Period),
			Method:    dbOTP.Method,
			Active:    dbOTP.Active,
			CreatedAt: dbOTP.CreatedAt,
		}
	}

	return otps, nil
}
