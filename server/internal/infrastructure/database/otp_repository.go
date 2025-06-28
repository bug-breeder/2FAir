package database

import (
	"context"
	"database/sql"
	"fmt"

	db "github.com/bug-breeder/2fair/server/internal/infrastructure/database/sqlc"
	"github.com/bug-breeder/2fair/server/internal/domain/entities"
	"github.com/bug-breeder/2fair/server/internal/domain/interfaces"
        infraServices "github.com/bug-breeder/2fair/server/internal/infrastructure/services"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type otpRepository struct {
	db            *DB
	queries       *db.Queries
	cryptoService infraServices.CryptoService
}

// NewOTPRepository creates a new OTP repository
func NewOTPRepository(database *DB, cryptoService infraServices.CryptoService) interfaces.OTPRepository {
	return &otpRepository{
		db:            database,
		queries:       db.New(database.Pool),
		cryptoService: cryptoService,
	}
}

// Create creates a new encrypted OTP entry
func (r *otpRepository) Create(ctx context.Context, otp *entities.OTP, encryptedData []byte, keyVersion int) error {
	// Use the pre-encrypted data directly (client-side encrypted: ciphertext.iv.authTag)
	params := db.CreateEncryptedTOTPSeedParams{
		UserID:            pgtype.UUID{Bytes: otp.UserID, Valid: true},
		ServiceName:       otp.Issuer,    // Map Issuer to ServiceName
		AccountIdentifier: otp.Label,     // Map Label to AccountIdentifier
		EncryptedSecret:   encryptedData, // Store the client-encrypted data directly
		Algorithm:         otp.Algorithm,
		Digits:            int32(otp.Digits),
		Period:            int32(otp.Period),
		Issuer:            pgtype.Text{String: otp.Issuer, Valid: true},
		IconUrl:           pgtype.Text{},
		IsActive:          pgtype.Bool{Bool: true, Valid: true},
	}

	seed, err := r.queries.CreateEncryptedTOTPSeed(ctx, params)
	if err != nil {
		return fmt.Errorf("failed to create encrypted TOTP seed: %w", err)
	}

	// Update the OTP entity with the generated ID and timestamps
	otp.ID = uuid.UUID(seed.ID.Bytes)
	otp.CreatedAt = seed.CreatedAt.Time
	otp.UpdatedAt = seed.UpdatedAt.Time

	return nil
}

// GetByID retrieves a decrypted OTP by ID
func (r *otpRepository) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*entities.OTP, error) {
	params := db.GetEncryptedTOTPSeedByIDParams{
		ID:     pgtype.UUID{Bytes: id, Valid: true},
		UserID: pgtype.UUID{Bytes: userID, Valid: true},
	}

	seed, err := r.queries.GetEncryptedTOTPSeedByID(ctx, params)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, entities.ErrTOTPSeedNotFound
		}
		return nil, fmt.Errorf("failed to get encrypted TOTP seed: %w", err)
	}

	return r.convertToOTP(seed)
}

// GetByUserID retrieves all decrypted OTPs for a user
func (r *otpRepository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]*entities.OTP, error) {
	seeds, err := r.queries.GetEncryptedTOTPSeedsByUserID(ctx, pgtype.UUID{Bytes: userID, Valid: true})
	if err != nil {
		return nil, fmt.Errorf("failed to get encrypted TOTP seeds: %w", err)
	}

	otps := make([]*entities.OTP, 0, len(seeds))
	for _, seed := range seeds {
		otp, err := r.convertToOTP(seed)
		if err != nil {
			// Log error but continue with other OTPs
			continue
		}
		otps = append(otps, otp)
	}

	return otps, nil
}

// Update updates an existing encrypted OTP entry
func (r *otpRepository) Update(ctx context.Context, otp *entities.OTP, encryptedData []byte, keyVersion int) error {
	// Use the pre-encrypted data directly (client-side encrypted: ciphertext.iv.authTag)
	params := db.UpdateEncryptedTOTPSeedParams{
		ID:                pgtype.UUID{Bytes: otp.ID, Valid: true},
		UserID:            pgtype.UUID{Bytes: otp.UserID, Valid: true},
		ServiceName:       pgtype.Text{String: otp.Issuer, Valid: true},
		AccountIdentifier: pgtype.Text{String: otp.Label, Valid: true},
		EncryptedSecret:   encryptedData, // Store the client-encrypted data directly
		Algorithm:         pgtype.Text{String: otp.Algorithm, Valid: true},
		Digits:            pgtype.Int4{Int32: int32(otp.Digits), Valid: true},
		Period:            pgtype.Int4{Int32: int32(otp.Period), Valid: true},
		Issuer:            pgtype.Text{String: otp.Issuer, Valid: true},
		IconUrl:           pgtype.Text{},
	}

	seed, err := r.queries.UpdateEncryptedTOTPSeed(ctx, params)
	if err != nil {
		return fmt.Errorf("failed to update encrypted TOTP seed: %w", err)
	}

	// Update the OTP entity timestamps
	otp.UpdatedAt = seed.UpdatedAt.Time

	return nil
}

// Delete soft deletes an OTP entry (marks as inactive)
func (r *otpRepository) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	params := db.DeleteEncryptedTOTPSeedParams{
		ID:     pgtype.UUID{Bytes: id, Valid: true},
		UserID: pgtype.UUID{Bytes: userID, Valid: true},
	}

	err := r.queries.DeleteEncryptedTOTPSeed(ctx, params)
	if err != nil {
		return fmt.Errorf("failed to delete encrypted TOTP seed: %w", err)
	}

	return nil
}

// GetEncryptedData retrieves the raw encrypted data for an OTP
func (r *otpRepository) GetEncryptedData(ctx context.Context, id uuid.UUID, userID uuid.UUID) ([]byte, int, error) {
	params := db.GetEncryptedTOTPSeedByIDParams{
		ID:     pgtype.UUID{Bytes: id, Valid: true},
		UserID: pgtype.UUID{Bytes: userID, Valid: true},
	}

	seed, err := r.queries.GetEncryptedTOTPSeedByID(ctx, params)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, 0, entities.ErrTOTPSeedNotFound
		}
		return nil, 0, fmt.Errorf("failed to get encrypted TOTP seed: %w", err)
	}

	return seed.EncryptedSecret, 1, nil // Return keyVersion as 1 for now
}

// convertToOTP converts a database EncryptedTOTPSeed to a domain OTP entity
func (r *otpRepository) convertToOTP(seed db.EncryptedTotpSeed) (*entities.OTP, error) {
	// Return the encrypted secret exactly as stored (ciphertext.iv.authTag format)
	// No processing needed - the client will handle decryption
	secretForClient := string(seed.EncryptedSecret)

	otp := &entities.OTP{
		ID:        uuid.UUID(seed.ID.Bytes),
		UserID:    uuid.UUID(seed.UserID.Bytes),
		Issuer:    seed.ServiceName,       // Map ServiceName back to Issuer
		Label:     seed.AccountIdentifier, // Map AccountIdentifier back to Label
		Secret:    secretForClient,        // Return encrypted secret in original format
		Period:    int(seed.Period),
		Algorithm: seed.Algorithm,
		Digits:    int(seed.Digits),
		CreatedAt: seed.CreatedAt.Time,
		UpdatedAt: seed.UpdatedAt.Time,
		IsActive:  seed.IsActive.Bool,
	}

	return otp, nil
}
