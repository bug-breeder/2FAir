package test

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"testing"
	"time"

	"github.com/ory/dockertest/v3"
	"github.com/ory/dockertest/v3/docker"
	"github.com/stretchr/testify/suite"

	"github.com/bug-breeder/2fair/server/internal/domain/entities"
	"github.com/bug-breeder/2fair/server/internal/infrastructure/config"
	"github.com/bug-breeder/2fair/server/internal/infrastructure/database"
)

// IntegrationTestSuite provides a base for integration tests
type IntegrationTestSuite struct {
	suite.Suite
	DB       *database.DB
	Config   *config.Config
	pool     *dockertest.Pool
	resource *dockertest.Resource
}

// SetupSuite runs before all tests in the suite
func (suite *IntegrationTestSuite) SetupSuite() {
	// Skip integration tests if running unit tests only
	if testing.Short() {
		suite.T().Skip("Skipping integration tests in short mode")
	}

	// Setup Docker test environment
	pool, err := dockertest.NewPool("")
	if err != nil {
		suite.T().Fatalf("Could not connect to Docker: %s", err)
	}
	suite.pool = pool

	// Pull PostgreSQL image and run container
	resource, err := pool.RunWithOptions(&dockertest.RunOptions{
		Repository: "postgres",
		Tag:        "15-alpine",
		Env: []string{
			"POSTGRES_PASSWORD=testpassword",
			"POSTGRES_USER=testuser",
			"POSTGRES_DB=testdb",
			"listen_addresses = '*'",
		},
	}, func(config *docker.HostConfig) {
		config.AutoRemove = true
		config.RestartPolicy = docker.RestartPolicy{Name: "no"}
	})
	if err != nil {
		suite.T().Fatalf("Could not start PostgreSQL container: %s", err)
	}
	suite.resource = resource

	// Set expiration for container cleanup
	if err := resource.Expire(120); err != nil {
		suite.T().Fatalf("Could not set container expiration: %s", err)
	}

	// Setup test configuration
	suite.setupTestConfig()

	// Wait for database to be ready
	pool.MaxWait = 120 * time.Second
	if err := pool.Retry(func() error {
		db, err := sql.Open("postgres", suite.Config.GetDatabaseURL())
		if err != nil {
			return err
		}
		defer db.Close()
		return db.Ping()
	}); err != nil {
		suite.T().Fatalf("Could not connect to PostgreSQL container: %s", err)
	}

	// Initialize database connection
	suite.DB, err = database.NewDB(suite.Config)
	if err != nil {
		suite.T().Fatalf("Could not initialize database: %s", err)
	}

	// Run migrations
	if err := database.RunMigrations(suite.Config); err != nil {
		suite.T().Fatalf("Could not run migrations: %s", err)
	}

	suite.T().Log("Integration test suite setup complete")
}

// TearDownSuite runs after all tests in the suite
func (suite *IntegrationTestSuite) TearDownSuite() {
	if suite.DB != nil {
		suite.DB.Close()
	}

	if suite.pool != nil && suite.resource != nil {
		if err := suite.pool.Purge(suite.resource); err != nil {
			log.Printf("Could not purge PostgreSQL container: %s", err)
		}
	}

	suite.T().Log("Integration test suite teardown complete")
}

// SetupTest runs before each test
func (suite *IntegrationTestSuite) SetupTest() {
	// Clean up database for each test
	suite.cleanupDatabase()
}

// TearDownTest runs after each test
func (suite *IntegrationTestSuite) TearDownTest() {
	// Additional cleanup if needed
}

// setupTestConfig creates a test configuration
func (suite *IntegrationTestSuite) setupTestConfig() {
	// Set test environment variables
	os.Setenv("DB_HOST", "localhost")
	os.Setenv("DB_PORT", suite.resource.GetPort("5432/tcp"))
	os.Setenv("DB_USER", "testuser")
	os.Setenv("DB_PASSWORD", "testpassword")
	os.Setenv("DB_NAME", "testdb")
	os.Setenv("DB_SSL_MODE", "disable")
	os.Setenv("JWT_SIGNING_KEY", "test-jwt-key-for-integration-tests")
	os.Setenv("OAUTH_SESSION_SECRET", "test-oauth-session-secret")
	os.Setenv("WEBAUTHN_RP_ID", "localhost")
	os.Setenv("WEBAUTHN_RP_DISPLAY_NAME", "2FAir Test")
	os.Setenv("WEBAUTHN_RP_ORIGINS", "http://localhost:3000")
	os.Setenv("ENVIRONMENT", "test")

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		suite.T().Fatalf("Could not load test configuration: %s", err)
	}
	suite.Config = cfg
}

// cleanupDatabase truncates all tables for clean test state
func (suite *IntegrationTestSuite) cleanupDatabase() {
	ctx := context.Background()

	// Get all table names
	rows, err := suite.DB.Pool.Query(ctx, `
		SELECT tablename FROM pg_tables 
		WHERE schemaname = 'public' 
		AND tablename != 'goose_db_version'
	`)
	if err != nil {
		suite.T().Fatalf("Could not get table names: %s", err)
	}
	defer rows.Close()

	var tables []string
	for rows.Next() {
		var tableName string
		if err := rows.Scan(&tableName); err != nil {
			suite.T().Fatalf("Could not scan table name: %s", err)
		}
		tables = append(tables, tableName)
	}

	// Truncate all tables
	for _, table := range tables {
		_, err := suite.DB.Pool.Exec(ctx, fmt.Sprintf("TRUNCATE TABLE %s CASCADE", table))
		if err != nil {
			suite.T().Fatalf("Could not truncate table %s: %s", table, err)
		}
	}
}

// CreateTestUser creates a test user for integration tests
func (suite *IntegrationTestSuite) CreateTestUser(username, email, displayName string) *entities.User {
	user := entities.NewUser(username, email, displayName)

	// In a real integration test, you would use the repository to create the user
	// For now, we just return the entity
	return user
}

// AssertDatabaseConnection verifies the database connection is working
func (suite *IntegrationTestSuite) AssertDatabaseConnection() {
	ctx := context.Background()

	// Test basic query
	var result int
	err := suite.DB.Pool.QueryRow(ctx, "SELECT 1").Scan(&result)
	suite.Require().NoError(err)
	suite.Assert().Equal(1, result)
}

// GetTestConfig returns a configuration suitable for testing
func GetTestConfig() *config.Config {
	// Set test environment variables
	os.Setenv("JWT_SIGNING_KEY", "test-jwt-key")
	os.Setenv("OAUTH_SESSION_SECRET", "test-oauth-session-secret")
	os.Setenv("WEBAUTHN_RP_ID", "localhost")
	os.Setenv("WEBAUTHN_RP_DISPLAY_NAME", "2FAir Test")
	os.Setenv("WEBAUTHN_RP_ORIGINS", "http://localhost:3000")
	os.Setenv("ENVIRONMENT", "test")
	os.Setenv("DB_HOST", "localhost")
	os.Setenv("DB_PORT", "5432")
	os.Setenv("DB_USER", "testuser")
	os.Setenv("DB_PASSWORD", "testpassword")
	os.Setenv("DB_NAME", "testdb")
	os.Setenv("DB_SSL_MODE", "disable")

	cfg, err := config.Load()
	if err != nil {
		panic(fmt.Sprintf("Could not load test configuration: %s", err))
	}
	return cfg
}
