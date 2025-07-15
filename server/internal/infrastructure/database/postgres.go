package database

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/bug-breeder/2fair/server/internal/infrastructure/config"
	"github.com/bug-breeder/2fair/server/internal/infrastructure/metrics"
)

// DB wraps the pgxpool.Pool with additional functionality
type DB struct {
	Pool    *pgxpool.Pool
	metrics *metrics.Metrics
}

// NewDB creates a new database connection pool with comprehensive timing metrics
func NewDB(cfg *config.Config, appMetrics *metrics.Metrics) (*DB, error) {
	// Extract database host for metrics (remove credentials for safety)
	databaseHost := cfg.Database.Host
	if databaseHost == "" {
		// For NeonDB, extract from full URL safely
		if cfg.Database.Host != "" {
			databaseHost = cfg.Database.Host
		} else {
			databaseHost = "neondb" // fallback for metrics
		}
	}

	// Start database connection timing
	timer := appMetrics.StartDatabaseTimer(cfg.Server.Environment, databaseHost)

	// Enhanced logging for connection start
	logger := slog.With(
		"component", "database",
		"environment", cfg.Server.Environment,
		"database_host", databaseHost,
		"max_connections", cfg.Database.MaxConnections,
		"max_idle_connections", cfg.Database.MaxIdleConns,
	)

	logger.Info("Initializing database connection pool",
		"connection_timeout", cfg.Database.ConnMaxLifetime,
		"idle_timeout", cfg.Database.ConnMaxIdleTime,
	)

	// Create connection config with detailed logging
	poolConfig, err := pgxpool.ParseConfig(cfg.GetDatabaseURL())
	if err != nil {
		timer.Complete("parse_config_failed", 0)
		logger.Error("Failed to parse database URL",
			"error", err,
			"database_url_length", len(cfg.GetDatabaseURL()),
		)
		return nil, fmt.Errorf("failed to parse database URL: %w", err)
	}

	// Configure connection pool with optimizations
	poolConfig.MaxConns = int32(cfg.Database.MaxConnections)
	poolConfig.MaxConnIdleTime = cfg.Database.ConnMaxIdleTime
	poolConfig.MaxConnLifetime = cfg.Database.ConnMaxLifetime
	poolConfig.MinConns = int32(cfg.Database.MaxIdleConns)

	// Add connection pool configuration logging
	logger.Info("Database pool configuration applied",
		"max_conns", poolConfig.MaxConns,
		"min_conns", poolConfig.MinConns,
		"max_conn_idle_time", poolConfig.MaxConnIdleTime,
		"max_conn_lifetime", poolConfig.MaxConnLifetime,
	)

	// Create connection pool with timeout context
	poolCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(poolCtx, poolConfig)
	if err != nil {
		timer.Complete("pool_creation_failed", 0)
		logger.Error("Failed to create connection pool",
			"error", err,
			"timeout_seconds", 30,
		)
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	db := &DB{
		Pool:    pool,
		metrics: appMetrics,
	}

	// Test the connection with enhanced logging
	logger.Info("Testing database connection")
	pingStart := time.Now()

	if err := db.Ping(context.Background()); err != nil {
		pool.Close()
		timer.Complete("ping_failed", 0)
		logger.Error("Database ping failed",
			"error", err,
			"ping_duration_ms", time.Since(pingStart).Milliseconds(),
		)
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	pingDuration := time.Since(pingStart)

	// Get pool stats for detailed logging
	stats := pool.Stat()
	connectionCount := int(stats.TotalConns())

	// Complete timing with success status
	timer.Complete("success", connectionCount)

	// Enhanced success logging
	logger.Info("Database connection pool established successfully",
		"ping_duration_ms", pingDuration.Milliseconds(),
		"initial_connections", connectionCount,
		"acquired_conns", stats.AcquiredConns(),
		"idle_conns", stats.IdleConns(),
		"max_conns", stats.MaxConns(),
		"database_type", "postgresql",
		"is_neon_db", true,
	)

	// Update health status metric
	appMetrics.UpdateDatabaseStatus(cfg.Server.Environment, databaseHost, true)

	return db, nil
}

// Ping tests the database connection with enhanced metrics
func (db *DB) Ping(ctx context.Context) error {
	start := time.Now()
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	err := db.Pool.Ping(ctx)
	duration := time.Since(start)

	// Log ping result with timing
	if err != nil {
		slog.Error("Database ping failed",
			"error", err,
			"ping_duration_ms", duration.Milliseconds(),
			"timeout_seconds", 5,
		)
	} else {
		slog.Debug("Database ping successful",
			"ping_duration_ms", duration.Milliseconds(),
		)
	}

	return err
}

// Close closes the database connection pool
func (db *DB) Close() {
	if db.Pool != nil {
		slog.Info("Closing database connection pool")
		db.Pool.Close()
		slog.Info("Database connection pool closed")
	}
}

// Health returns database health information with enhanced metrics
func (db *DB) Health(ctx context.Context) (*HealthInfo, error) {
	start := time.Now()
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	stats := db.Pool.Stat()

	// Test connection
	if err := db.Pool.Ping(ctx); err != nil {
		duration := time.Since(start)

		// Record failed health check
		if db.metrics != nil {
			db.metrics.RecordHealthCheck("unknown", "/health", "failed", duration)
		}

		healthInfo := &HealthInfo{
			Status:  "unhealthy",
			Message: fmt.Sprintf("failed to ping database: %v", err),
		}

		slog.Warn("Database health check failed",
			"error", err,
			"health_check_duration_ms", duration.Milliseconds(),
			"acquired_conns", stats.AcquiredConns(),
			"total_conns", stats.TotalConns(),
		)

		return healthInfo, err
	}

	duration := time.Since(start)

	// Record successful health check
	if db.metrics != nil {
		db.metrics.RecordHealthCheck("unknown", "/health", "success", duration)
	}

	healthInfo := &HealthInfo{
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
		HealthCheckDuration:  duration,
	}

	slog.Debug("Database health check completed",
		"status", "healthy",
		"health_check_duration_ms", duration.Milliseconds(),
		"acquired_conns", healthInfo.AcquiredConns,
		"idle_conns", healthInfo.IdleConns,
		"total_conns", healthInfo.TotalConns,
		"acquire_duration_ms", healthInfo.AcquireDuration.Milliseconds(),
	)

	return healthInfo, nil
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
	HealthCheckDuration  time.Duration `json:"health_check_duration"`
}

// WithTransaction executes a function within a database transaction
func (db *DB) WithTransaction(ctx context.Context, fn func(tx pgx.Tx) error) error {
	start := time.Now()
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		slog.Error("Failed to begin database transaction",
			"error", err,
			"begin_duration_ms", time.Since(start).Milliseconds(),
		)
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	defer func() {
		if p := recover(); p != nil {
			rollbackStart := time.Now()
			_ = tx.Rollback(ctx)
			slog.Error("Database transaction panicked and rolled back",
				"panic", p,
				"rollback_duration_ms", time.Since(rollbackStart).Milliseconds(),
			)
			panic(p)
		}
	}()

	if err := fn(tx); err != nil {
		rollbackStart := time.Now()
		if rbErr := tx.Rollback(ctx); rbErr != nil {
			slog.Error("Database transaction and rollback both failed",
				"transaction_error", err,
				"rollback_error", rbErr,
				"rollback_duration_ms", time.Since(rollbackStart).Milliseconds(),
				"total_duration_ms", time.Since(start).Milliseconds(),
			)
			return fmt.Errorf("transaction failed: %v, rollback failed: %w", err, rbErr)
		}

		slog.Debug("Database transaction rolled back",
			"transaction_error", err,
			"rollback_duration_ms", time.Since(rollbackStart).Milliseconds(),
			"total_duration_ms", time.Since(start).Milliseconds(),
		)
		return err
	}

	commitStart := time.Now()
	if err := tx.Commit(ctx); err != nil {
		slog.Error("Failed to commit database transaction",
			"error", err,
			"commit_duration_ms", time.Since(commitStart).Milliseconds(),
			"total_duration_ms", time.Since(start).Milliseconds(),
		)
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	totalDuration := time.Since(start)
	commitDuration := time.Since(commitStart)

	slog.Debug("Database transaction committed successfully",
		"commit_duration_ms", commitDuration.Milliseconds(),
		"total_duration_ms", totalDuration.Milliseconds(),
	)

	return nil
}
