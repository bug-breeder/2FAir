package database

import (
	"database/sql"
	"fmt"
	"log/slog"

	_ "github.com/lib/pq" // PostgreSQL driver for goose
	"github.com/pressly/goose/v3"

	"github.com/bug-breeder/2fair/server/internal/infrastructure/config"
	"github.com/bug-breeder/2fair/server/internal/infrastructure/metrics"
)

// MigrationManager handles database migrations
type MigrationManager struct {
	db      *sql.DB
	cfg     *config.Config
	metrics *metrics.Metrics
	logger  *slog.Logger
}

// NewMigrationManager creates a new migration manager
func NewMigrationManager(cfg *config.Config, appMetrics *metrics.Metrics) (*MigrationManager, error) {
	logger := slog.With(
		"component", "database_migration",
		"environment", cfg.Server.Environment,
	)

	logger.Info("Initializing migration manager")

	// Create a standard sql.DB connection for goose
	db, err := sql.Open("postgres", cfg.GetDatabaseURL())
	if err != nil {
		logger.Error("Failed to open database connection for migrations",
			"error", err,
		)
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	// Test the connection
	if err := db.Ping(); err != nil {
		db.Close()
		logger.Error("Failed to ping database for migrations",
			"error", err,
		)
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	logger.Info("Migration manager initialized successfully")

	return &MigrationManager{
		db:      db,
		cfg:     cfg,
		metrics: appMetrics,
		logger:  logger,
	}, nil
}

// Close closes the migration manager database connection
func (m *MigrationManager) Close() error {
	if m.db != nil {
		m.logger.Info("Closing migration manager database connection")
		return m.db.Close()
	}
	return nil
}

// Up runs all pending migrations with detailed timing and logging
func (m *MigrationManager) Up() error {
	timer := m.metrics.StartMigrationTimer(m.cfg.Server.Environment, "up")

	m.logger.Info("Starting database migrations (up)")

	goose.SetBaseFS(nil)

	if err := goose.SetDialect("postgres"); err != nil {
		timer.Complete("dialect_failed", 0)
		m.logger.Error("Failed to set migration dialect",
			"error", err,
			"dialect", "postgres",
		)
		return fmt.Errorf("failed to set dialect: %w", err)
	}

	// Get current version before migration
	currentVersion, err := goose.GetDBVersion(m.db)
	if err != nil {
		m.logger.Warn("Could not get current database version",
			"error", err,
		)
		currentVersion = 0
	}

	m.logger.Info("Current database version",
		"version", currentVersion,
	)

	// Migration files are located in the migrations directory
	migrationDir := "internal/infrastructure/database/migrations"

	if err := goose.Up(m.db, migrationDir); err != nil {
		timer.Complete("migration_failed", 0)
		m.logger.Error("Database migrations failed",
			"error", err,
			"migration_dir", migrationDir,
			"current_version", currentVersion,
		)
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	// Get new version after migration
	newVersion, err := goose.GetDBVersion(m.db)
	if err != nil {
		m.logger.Warn("Could not get new database version after migration",
			"error", err,
		)
		newVersion = currentVersion
	}

	migrationsApplied := int(newVersion - currentVersion)
	if migrationsApplied < 0 {
		migrationsApplied = 0
	}

	timer.Complete("success", migrationsApplied)

	m.logger.Info("Database migrations completed successfully",
		"migrations_applied", migrationsApplied,
		"previous_version", currentVersion,
		"new_version", newVersion,
		"migration_dir", migrationDir,
	)

	return nil
}

// Down rolls back migrations with detailed timing and logging
func (m *MigrationManager) Down() error {
	timer := m.metrics.StartMigrationTimer(m.cfg.Server.Environment, "down")

	m.logger.Info("Starting database migration rollback (down)")

	goose.SetBaseFS(nil)

	if err := goose.SetDialect("postgres"); err != nil {
		timer.Complete("dialect_failed", 0)
		m.logger.Error("Failed to set migration dialect for rollback",
			"error", err,
			"dialect", "postgres",
		)
		return fmt.Errorf("failed to set dialect: %w", err)
	}

	// Get current version before rollback
	currentVersion, err := goose.GetDBVersion(m.db)
	if err != nil {
		m.logger.Warn("Could not get current database version before rollback",
			"error", err,
		)
		currentVersion = 0
	}

	m.logger.Info("Rolling back from database version",
		"version", currentVersion,
	)

	migrationDir := "internal/infrastructure/database/migrations"

	if err := goose.Down(m.db, migrationDir); err != nil {
		timer.Complete("rollback_failed", 0)
		m.logger.Error("Database migration rollback failed",
			"error", err,
			"migration_dir", migrationDir,
			"current_version", currentVersion,
		)
		return fmt.Errorf("failed to rollback migration: %w", err)
	}

	// Get new version after rollback
	newVersion, err := goose.GetDBVersion(m.db)
	if err != nil {
		m.logger.Warn("Could not get new database version after rollback",
			"error", err,
		)
		newVersion = currentVersion
	}

	migrationsRolledBack := int(currentVersion - newVersion)
	if migrationsRolledBack < 0 {
		migrationsRolledBack = 0
	}

	timer.Complete("success", migrationsRolledBack)

	m.logger.Info("Database migration rollback completed successfully",
		"migrations_rolled_back", migrationsRolledBack,
		"previous_version", currentVersion,
		"new_version", newVersion,
	)

	return nil
}

// Status shows the migration status with enhanced logging
func (m *MigrationManager) Status() error {
	m.logger.Info("Checking database migration status")

	goose.SetBaseFS(nil)

	if err := goose.SetDialect("postgres"); err != nil {
		m.logger.Error("Failed to set migration dialect for status check",
			"error", err,
		)
		return fmt.Errorf("failed to set dialect: %w", err)
	}

	migrationDir := "internal/infrastructure/database/migrations"

	if err := goose.Status(m.db, migrationDir); err != nil {
		m.logger.Error("Failed to get migration status",
			"error", err,
			"migration_dir", migrationDir,
		)
		return fmt.Errorf("failed to get migration status: %w", err)
	}

	return nil
}

// Version shows the current migration version with enhanced logging
func (m *MigrationManager) Version() (int64, error) {
	goose.SetBaseFS(nil)

	if err := goose.SetDialect("postgres"); err != nil {
		m.logger.Error("Failed to set migration dialect for version check",
			"error", err,
		)
		return 0, fmt.Errorf("failed to set dialect: %w", err)
	}

	version, err := goose.GetDBVersion(m.db)
	if err != nil {
		m.logger.Error("Failed to get database version",
			"error", err,
		)
		return 0, fmt.Errorf("failed to get database version: %w", err)
	}

	m.logger.Info("Current database version",
		"version", version,
	)

	return version, nil
}

// Create creates a new migration file with enhanced logging
func (m *MigrationManager) Create(name string) error {
	m.logger.Info("Creating new migration file",
		"migration_name", name,
	)

	migrationDir := "internal/infrastructure/database/migrations"

	if err := goose.Create(m.db, migrationDir, name, "sql"); err != nil {
		m.logger.Error("Failed to create migration file",
			"error", err,
			"migration_name", name,
			"migration_dir", migrationDir,
		)
		return fmt.Errorf("failed to create migration: %w", err)
	}

	m.logger.Info("Migration file created successfully",
		"migration_name", name,
		"migration_dir", migrationDir,
	)

	return nil
}

// RunMigrations is a convenience function to run migrations during application startup
// with comprehensive timing and logging
func RunMigrations(cfg *config.Config, appMetrics *metrics.Metrics) error {
	logger := slog.With(
		"component", "database_migration",
		"environment", cfg.Server.Environment,
		"operation", "startup_migrations",
	)

	logger.Info("Starting application startup migrations")

	migrationManager, err := NewMigrationManager(cfg, appMetrics)
	if err != nil {
		logger.Error("Failed to create migration manager",
			"error", err,
		)
		return fmt.Errorf("failed to create migration manager: %w", err)
	}
	defer func() {
		if closeErr := migrationManager.Close(); closeErr != nil {
			logger.Error("Failed to close migration manager",
				"error", closeErr,
			)
		}
	}()

	if err := migrationManager.Up(); err != nil {
		logger.Error("Application startup migrations failed",
			"error", err,
		)
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	logger.Info("Application startup migrations completed successfully")
	return nil
}
