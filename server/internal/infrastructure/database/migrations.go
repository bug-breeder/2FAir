package database

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq" // PostgreSQL driver for goose
	"github.com/pressly/goose/v3"

	"github.com/bug-breeder/2fair/server/internal/infrastructure/config"
)

// MigrationManager handles database migrations
type MigrationManager struct {
	db  *sql.DB
	cfg *config.Config
}

// NewMigrationManager creates a new migration manager
func NewMigrationManager(cfg *config.Config) (*MigrationManager, error) {
	// Create a standard sql.DB connection for goose
	db, err := sql.Open("postgres", cfg.GetDatabaseURL())
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	return &MigrationManager{
		db:  db,
		cfg: cfg,
	}, nil
}

// Close closes the migration manager database connection
func (m *MigrationManager) Close() error {
	return m.db.Close()
}

// Up runs all pending migrations
func (m *MigrationManager) Up() error {
	goose.SetBaseFS(nil)

	if err := goose.SetDialect("postgres"); err != nil {
		return fmt.Errorf("failed to set dialect: %w", err)
	}

	// Migration files are located in the migrations directory
	migrationDir := "internal/infrastructure/database/migrations"

	if err := goose.Up(m.db, migrationDir); err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	return nil
}

// Down rolls back migrations
func (m *MigrationManager) Down() error {
	goose.SetBaseFS(nil)

	if err := goose.SetDialect("postgres"); err != nil {
		return fmt.Errorf("failed to set dialect: %w", err)
	}

	migrationDir := "internal/infrastructure/database/migrations"

	if err := goose.Down(m.db, migrationDir); err != nil {
		return fmt.Errorf("failed to rollback migration: %w", err)
	}

	return nil
}

// Status shows the migration status
func (m *MigrationManager) Status() error {
	goose.SetBaseFS(nil)

	if err := goose.SetDialect("postgres"); err != nil {
		return fmt.Errorf("failed to set dialect: %w", err)
	}

	migrationDir := "internal/infrastructure/database/migrations"

	if err := goose.Status(m.db, migrationDir); err != nil {
		return fmt.Errorf("failed to get migration status: %w", err)
	}

	return nil
}

// Version shows the current migration version
func (m *MigrationManager) Version() (int64, error) {
	goose.SetBaseFS(nil)

	if err := goose.SetDialect("postgres"); err != nil {
		return 0, fmt.Errorf("failed to set dialect: %w", err)
	}

	version, err := goose.GetDBVersion(m.db)
	if err != nil {
		return 0, fmt.Errorf("failed to get database version: %w", err)
	}

	return version, nil
}

// Create creates a new migration file
func (m *MigrationManager) Create(name string) error {
	migrationDir := "internal/infrastructure/database/migrations"

	if err := goose.Create(m.db, migrationDir, name, "sql"); err != nil {
		return fmt.Errorf("failed to create migration: %w", err)
	}

	return nil
}

// RunMigrations is a convenience function to run migrations during application startup
func RunMigrations(cfg *config.Config) error {
	migrationManager, err := NewMigrationManager(cfg)
	if err != nil {
		return fmt.Errorf("failed to create migration manager: %w", err)
	}
	defer migrationManager.Close()

	if err := migrationManager.Up(); err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	return nil
}
