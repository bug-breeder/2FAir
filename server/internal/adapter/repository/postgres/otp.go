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
	fmt.Printf("Repository EditOTP called - userID: %d, otpID: %d, issuer: %s, label: %s\n",
		userID, otpID, otp.Issuer, otp.Label)

	// First, get the existing OTP to merge changes
	existingOTP, err := r.queries.GetOTP(ctx, sqlc.GetOTPParams{
		ID:     int32(otpID),
		UserID: int32(userID),
	})
	if err != nil {
		fmt.Printf("Repository EditOTP - failed to get existing OTP: %v\n", err)
		return fmt.Errorf("error getting existing OTP: %w", err)
	}

	// Merge changes - only update fields that are provided (non-empty/non-zero)
	updatedOTP := existingOTP

	if otp.Issuer != "" {
		updatedOTP.Issuer = otp.Issuer
	}
	if otp.Label != "" {
		updatedOTP.Label = otp.Label
	}
	if otp.Secret != "" {
		updatedOTP.Secret = otp.Secret
	}
	if otp.Algorithm != "" {
		updatedOTP.Algorithm = otp.Algorithm
	}
	if otp.Digits != 0 {
		updatedOTP.Digits = int32(otp.Digits)
	}
	if otp.Period != 0 {
		updatedOTP.Period = int32(otp.Period)
	}
	if otp.Counter != 0 {
		updatedOTP.Counter = int32(otp.Counter)
	}
	if otp.Method != "" {
		updatedOTP.Method = otp.Method
	}

	params := sqlc.EditOTPParams{
		ID:        int32(otpID),
		UserID:    int32(userID),
		Issuer:    updatedOTP.Issuer,
		Label:     updatedOTP.Label,
		Secret:    updatedOTP.Secret,
		Algorithm: updatedOTP.Algorithm,
		Digits:    updatedOTP.Digits,
		Period:    updatedOTP.Period,
		Counter:   updatedOTP.Counter,
		Method:    updatedOTP.Method,
	}

	fmt.Printf("Repository EditOTP merged params - ID: %d, UserID: %d, Issuer: %s, Label: %s, Algorithm: %s, Digits: %d, Period: %d, Method: %s\n",
		params.ID, params.UserID, params.Issuer, params.Label, params.Algorithm, params.Digits, params.Period, params.Method)

	result, err := r.queries.EditOTP(ctx, params)
	if err != nil {
		fmt.Printf("Repository EditOTP SQL error: %v\n", err)
		return fmt.Errorf("error updating OTP: %w", err)
	}

	fmt.Printf("Repository EditOTP success - updated OTP ID: %d, new issuer: %s\n", result.ID, result.Issuer)
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
