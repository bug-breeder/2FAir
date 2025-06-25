package database

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/bug-breeder/2fair/server/internal/infrastructure/config"
)

// DB wraps the pgxpool.Pool with additional functionality
type DB struct {
	Pool *pgxpool.Pool
}

// NewDB creates a new database connection pool
func NewDB(cfg *config.Config) (*DB, error) {
	// Create connection config
	poolConfig, err := pgxpool.ParseConfig(cfg.GetDatabaseURL())
	if err != nil {
		return nil, fmt.Errorf("failed to parse database URL: %w", err)
	}

	// Configure connection pool
	poolConfig.MaxConns = int32(cfg.Database.MaxConnections)
	poolConfig.MaxConnIdleTime = cfg.Database.ConnMaxIdleTime
	poolConfig.MaxConnLifetime = cfg.Database.ConnMaxLifetime
	poolConfig.MinConns = int32(cfg.Database.MaxIdleConns)

	// Create connection pool
	pool, err := pgxpool.NewWithConfig(context.Background(), poolConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	db := &DB{
		Pool: pool,
	}

	// Test the connection
	if err := db.Ping(context.Background()); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return db, nil
}

// Ping tests the database connection
func (db *DB) Ping(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	return db.Pool.Ping(ctx)
}

// Close closes the database connection pool
func (db *DB) Close() {
	db.Pool.Close()
}

// Health returns database health information
func (db *DB) Health(ctx context.Context) (*HealthInfo, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	stats := db.Pool.Stat()

	// Test connection
	if err := db.Pool.Ping(ctx); err != nil {
		return &HealthInfo{
			Status:  "unhealthy",
			Message: fmt.Sprintf("failed to ping database: %v", err),
		}, err
	}

	return &HealthInfo{
		Status:               "healthy",
		Message:              "database connection is healthy",
		AcquiredConns:        int(stats.AcquiredConns()),
		IdleConns:            int(stats.IdleConns()),
		MaxConns:             int(stats.MaxConns()),
		TotalConns:           int(stats.TotalConns()),
		NewConnsCount:        stats.NewConnsCount(),
		AcquireCount:         stats.AcquireCount(),
		AcquireDuration:      stats.AcquireDuration(),
		EmptyAcquireCount:    stats.EmptyAcquireCount(),
		CanceledAcquireCount: stats.CanceledAcquireCount(),
	}, nil
}

// HealthInfo contains database health information
type HealthInfo struct {
	Status               string        `json:"status"`
	Message              string        `json:"message"`
	AcquiredConns        int           `json:"acquired_conns"`
	IdleConns            int           `json:"idle_conns"`
	MaxConns             int           `json:"max_conns"`
	TotalConns           int           `json:"total_conns"`
	NewConnsCount        int64         `json:"new_conns_count"`
	AcquireCount         int64         `json:"acquire_count"`
	AcquireDuration      time.Duration `json:"acquire_duration"`
	EmptyAcquireCount    int64         `json:"empty_acquire_count"`
	CanceledAcquireCount int64         `json:"canceled_acquire_count"`
}

// WithTransaction executes a function within a database transaction
func (db *DB) WithTransaction(ctx context.Context, fn func(tx pgx.Tx) error) error {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback(ctx)
			panic(p)
		}
	}()

	if err := fn(tx); err != nil {
		if rbErr := tx.Rollback(ctx); rbErr != nil {
			return fmt.Errorf("transaction failed: %v, rollback failed: %w", err, rbErr)
		}
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}
