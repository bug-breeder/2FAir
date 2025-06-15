package test

import (
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/bug-breeder/2fair/server/internal/infrastructure/config"
)

func TestConfigLoad_Success(t *testing.T) {
	// Set required environment variables
	oldValues := setTestEnvVars(t)
	defer restoreEnvVars(oldValues)

	cfg, err := config.Load()
	require.NoError(t, err)
	require.NotNil(t, cfg)

	// Test Server configuration
	assert.Equal(t, "localhost", cfg.Server.Host)
	assert.Equal(t, 8080, cfg.Server.Port)
	assert.Equal(t, "test", cfg.Server.Environment)

	// Test Database configuration
	assert.Equal(t, "localhost", cfg.Database.Host)
	assert.Equal(t, 5432, cfg.Database.Port)
	assert.Equal(t, "2fair_test", cfg.Database.Name)

	// Test JWT configuration
	assert.Equal(t, "test-signing-key", cfg.JWT.SigningKey)
	assert.Equal(t, 1*time.Hour, cfg.JWT.ExpirationTime)

	// Test WebAuthn configuration
	assert.Equal(t, "2FAir Test", cfg.WebAuthn.RPDisplayName)
	assert.Equal(t, "localhost", cfg.WebAuthn.RPID)
	assert.Contains(t, cfg.WebAuthn.RPOrigins, "http://localhost:3000")

	// Test OAuth configuration
	assert.Equal(t, "test-session-secret", cfg.OAuth.SessionSecret)
	assert.Equal(t, "test-google-client-id", cfg.OAuth.Google.ClientID)
	assert.Equal(t, "test-github-client-id", cfg.OAuth.GitHub.ClientID)
}

func TestConfigLoad_MissingRequiredFields(t *testing.T) {
	tests := []struct {
		name        string
		missingVar  string
		expectedErr string
	}{
		{
			name:        "missing JWT signing key",
			missingVar:  "JWT_SIGNING_KEY",
			expectedErr: "JWT_SIGNING_KEY is required",
		},
		{
			name:        "missing OAuth session secret",
			missingVar:  "OAUTH_SESSION_SECRET",
			expectedErr: "OAUTH_SESSION_SECRET is required",
		},
		{
			name:        "missing WebAuthn RP ID",
			missingVar:  "WEBAUTHN_RP_ID",
			expectedErr: "WEBAUTHN_RP_ID is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			oldValues := setTestEnvVars(t)
			defer restoreEnvVars(oldValues)

			// Set the required environment variable to empty instead of unsetting
			if tt.missingVar == "WEBAUTHN_RP_ID" {
				os.Setenv(tt.missingVar, "")
			} else {
				// Remove the required environment variable
				os.Unsetenv(tt.missingVar)
			}

			cfg, err := config.Load()
			assert.Error(t, err)
			assert.Nil(t, cfg)
			if err != nil {
				assert.Contains(t, err.Error(), tt.expectedErr)
			}
		})
	}
}

func TestConfigLoad_ProductionValidation(t *testing.T) {
	oldValues := setTestEnvVars(t)
	defer restoreEnvVars(oldValues)

	// Set production environment
	os.Setenv("ENVIRONMENT", "production")
	os.Unsetenv("DB_PASSWORD") // Missing password in production

	cfg, err := config.Load()
	assert.Error(t, err)
	assert.Nil(t, cfg)
	assert.Contains(t, err.Error(), "DB_PASSWORD is required in production")
}

func TestConfigLoad_CustomValues(t *testing.T) {
	oldValues := setTestEnvVars(t)
	defer restoreEnvVars(oldValues)

	// Set custom values
	os.Setenv("SERVER_PORT", "9090")
	os.Setenv("JWT_EXPIRATION_TIME", "2h")
	os.Setenv("DB_MAX_CONNECTIONS", "50")

	cfg, err := config.Load()
	require.NoError(t, err)

	assert.Equal(t, 9090, cfg.Server.Port)
	assert.Equal(t, 2*time.Hour, cfg.JWT.ExpirationTime)
	assert.Equal(t, 50, cfg.Database.MaxConnections)
}

func TestConfigGetDatabaseURL(t *testing.T) {
	oldValues := setTestEnvVars(t)
	defer restoreEnvVars(oldValues)

	cfg, err := config.Load()
	require.NoError(t, err)

	expectedURL := "host=localhost port=5432 user=postgres password=test-password dbname=2fair_test sslmode=disable"
	assert.Equal(t, expectedURL, cfg.GetDatabaseURL())
}

func TestConfigMethods(t *testing.T) {
	oldValues := setTestEnvVars(t)
	defer restoreEnvVars(oldValues)

	// Test development environment first (current setting is "test")
	cfg, err := config.Load()
	require.NoError(t, err)

	// In test mode, should be neither development nor production
	assert.False(t, cfg.IsDevelopment())
	assert.False(t, cfg.IsProduction())
	assert.Equal(t, "localhost:8080", cfg.GetServerAddress())

	// Test production environment explicitly
	oldEnv := os.Getenv("ENVIRONMENT")
	os.Setenv("ENVIRONMENT", "production")

	cfg, err = config.Load()
	require.NoError(t, err)

	assert.False(t, cfg.IsDevelopment())
	assert.True(t, cfg.IsProduction())

	// Restore original environment
	os.Setenv("ENVIRONMENT", oldEnv)
}

// Helper functions

func setTestEnvVars(t *testing.T) map[string]string {
	t.Helper()

	// Store original values
	vars := []string{
		"JWT_SIGNING_KEY",
		"OAUTH_SESSION_SECRET",
		"WEBAUTHN_RP_ID",
		"WEBAUTHN_RP_DISPLAY_NAME",
		"WEBAUTHN_RP_ORIGINS",
		"SERVER_HOST",
		"SERVER_PORT",
		"ENVIRONMENT",
		"DB_HOST",
		"DB_PORT",
		"DB_NAME",
		"DB_USER",
		"DB_PASSWORD",
		"OAUTH_GOOGLE_CLIENT_ID",
		"OAUTH_GOOGLE_CLIENT_SECRET",
		"OAUTH_GITHUB_CLIENT_ID",
		"OAUTH_GITHUB_CLIENT_SECRET",
	}

	oldValues := make(map[string]string)
	for _, v := range vars {
		oldValues[v] = os.Getenv(v)
	}

	// Set test values
	os.Setenv("JWT_SIGNING_KEY", "test-signing-key")
	os.Setenv("OAUTH_SESSION_SECRET", "test-session-secret")
	os.Setenv("WEBAUTHN_RP_ID", "localhost")
	os.Setenv("WEBAUTHN_RP_DISPLAY_NAME", "2FAir Test")
	os.Setenv("WEBAUTHN_RP_ORIGINS", "http://localhost:3000,http://localhost:8080")
	os.Setenv("SERVER_HOST", "localhost")
	os.Setenv("SERVER_PORT", "8080")
	os.Setenv("ENVIRONMENT", "test")
	os.Setenv("DB_HOST", "localhost")
	os.Setenv("DB_PORT", "5432")
	os.Setenv("DB_NAME", "2fair_test")
	os.Setenv("DB_USER", "postgres")
	os.Setenv("DB_PASSWORD", "test-password")
	os.Setenv("OAUTH_GOOGLE_CLIENT_ID", "test-google-client-id")
	os.Setenv("OAUTH_GOOGLE_CLIENT_SECRET", "test-google-client-secret")
	os.Setenv("OAUTH_GITHUB_CLIENT_ID", "test-github-client-id")
	os.Setenv("OAUTH_GITHUB_CLIENT_SECRET", "test-github-client-secret")

	return oldValues
}

func restoreEnvVars(oldValues map[string]string) {
	for k, v := range oldValues {
		if v == "" {
			os.Unsetenv(k)
		} else {
			os.Setenv(k, v)
		}
	}
}
