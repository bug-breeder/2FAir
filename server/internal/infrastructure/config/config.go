package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all configuration for the application
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	WebAuthn WebAuthnConfig
	OAuth    OAuthConfig
	Security SecurityConfig
	Frontend FrontendConfig
}

// ServerConfig holds server-related configuration
type ServerConfig struct {
	Host            string
	Port            int
	URL             string
	Environment     string
	ShutdownTimeout time.Duration
	ReadTimeout     time.Duration
	WriteTimeout    time.Duration
	MaxHeaderBytes  int
}

// DatabaseConfig holds database-related configuration
type DatabaseConfig struct {
	Host            string
	Port            int
	Name            string
	User            string
	Password        string
	SSLMode         string
	MaxConnections  int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
	ConnMaxIdleTime time.Duration
}

// JWTConfig holds JWT-related configuration
type JWTConfig struct {
	SigningKey     string
	ExpirationTime time.Duration
	RefreshTime    time.Duration
	Issuer         string
	Audience       string
}

// WebAuthnConfig holds WebAuthn-related configuration
type WebAuthnConfig struct {
	RPDisplayName string
	RPID          string
	RPOrigins     []string
	Timeout       time.Duration
}

// OAuthConfig holds OAuth-related configuration
type OAuthConfig struct {
	Google        OAuthProviderConfig
	GitHub        OAuthProviderConfig
	Microsoft     OAuthProviderConfig
	SessionSecret string
	SessionMaxAge int
}

// OAuthProviderConfig holds configuration for a specific OAuth provider
type OAuthProviderConfig struct {
	ClientID     string
	ClientSecret string
	CallbackURL  string
	Scopes       []string
	Enabled      bool
}

// SecurityConfig holds security-related configuration
type SecurityConfig struct {
	RateLimitRPS   int
	RateLimitBurst int
	CORSOrigins    []string
	CSPPolicy      string
}

// FrontendConfig holds frontend-related configuration
type FrontendConfig struct {
	URL string
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	// Load .env file if it exists (for development)
	_ = godotenv.Load()

	config := &Config{
		Server: ServerConfig{
			Host:            getEnv("SERVER_HOST", "localhost"),
			Port:            getEnvAsInt("SERVER_PORT", 8080),
			URL:             getEnv("SERVER_URL", "http://localhost:8080"),
			Environment:     getEnv("ENVIRONMENT", "development"),
			ShutdownTimeout: getEnvAsDuration("SERVER_SHUTDOWN_TIMEOUT", 30*time.Second),
			ReadTimeout:     getEnvAsDuration("SERVER_READ_TIMEOUT", 15*time.Second),
			WriteTimeout:    getEnvAsDuration("SERVER_WRITE_TIMEOUT", 15*time.Second),
			MaxHeaderBytes:  getEnvAsInt("SERVER_MAX_HEADER_BYTES", 1<<20), // 1MB
		},
		Database: DatabaseConfig{
			Host:            getEnv("DB_HOST", "localhost"),
			Port:            getEnvAsInt("DB_PORT", 5432),
			Name:            getEnv("DB_NAME", "2fair"),
			User:            getEnv("DB_USER", "postgres"),
			Password:        getEnv("DB_PASSWORD", ""),
			SSLMode:         getEnv("DB_SSL_MODE", "disable"),
			MaxConnections:  getEnvAsInt("DB_MAX_CONNECTIONS", 10),
			MaxIdleConns:    getEnvAsInt("DB_MAX_IDLE_CONNS", 0),
			ConnMaxLifetime: getEnvAsDuration("DB_CONN_MAX_LIFETIME", 5*time.Minute),
			ConnMaxIdleTime: getEnvAsDuration("DB_CONN_MAX_IDLE_TIME", 1*time.Minute),
		},
		JWT: JWTConfig{
			SigningKey:     getEnv("JWT_SIGNING_KEY", ""),
			ExpirationTime: getEnvAsDuration("JWT_EXPIRATION_TIME", 1*time.Hour),
			RefreshTime:    getEnvAsDuration("JWT_REFRESH_TIME", 24*time.Hour),
			Issuer:         getEnv("JWT_ISSUER", "2fair.dev"),
			Audience:       getEnv("JWT_AUDIENCE", "2fair.dev"),
		},
		WebAuthn: WebAuthnConfig{
			RPDisplayName: getEnv("WEBAUTHN_RP_DISPLAY_NAME", "2FAir"),
			RPID:          getEnv("WEBAUTHN_RP_ID", "localhost"),
			RPOrigins:     getEnvAsSlice("WEBAUTHN_RP_ORIGINS", []string{"http://localhost:5173", "http://localhost:3000", "http://localhost:8080"}),
			Timeout:       getEnvAsDuration("WEBAUTHN_TIMEOUT", 60*time.Second),
		},
		OAuth: OAuthConfig{
			Google: OAuthProviderConfig{
				ClientID:     getEnv("OAUTH_GOOGLE_CLIENT_ID", ""),
				ClientSecret: getEnv("OAUTH_GOOGLE_CLIENT_SECRET", ""),
				CallbackURL:  getEnv("OAUTH_GOOGLE_CALLBACK_URL", ""),
				Scopes:       getEnvAsSlice("OAUTH_GOOGLE_SCOPES", []string{"email", "profile"}),
				Enabled:      getEnvAsBool("OAUTH_GOOGLE_ENABLED", false),
			},
			GitHub: OAuthProviderConfig{
				ClientID:     getEnv("OAUTH_GITHUB_CLIENT_ID", ""),
				ClientSecret: getEnv("OAUTH_GITHUB_CLIENT_SECRET", ""),
				CallbackURL:  getEnv("OAUTH_GITHUB_CALLBACK_URL", ""),
				Scopes:       getEnvAsSlice("OAUTH_GITHUB_SCOPES", []string{"user:email"}),
				Enabled:      getEnvAsBool("OAUTH_GITHUB_ENABLED", false),
			},
			Microsoft: OAuthProviderConfig{
				ClientID:     getEnv("OAUTH_MICROSOFT_CLIENT_ID", ""),
				ClientSecret: getEnv("OAUTH_MICROSOFT_CLIENT_SECRET", ""),
				CallbackURL:  getEnv("OAUTH_MICROSOFT_CALLBACK_URL", "http://localhost:8080/auth/oauth/callback/microsoft"),
				Scopes:       getEnvAsSlice("OAUTH_MICROSOFT_SCOPES", []string{"https://graph.microsoft.com/User.Read"}),
				Enabled:      getEnvAsBool("OAUTH_MICROSOFT_ENABLED", false),
			},
			SessionSecret: getEnv("OAUTH_SESSION_SECRET", "dev-session-secret-change-in-production"),
			SessionMaxAge: getEnvAsInt("OAUTH_SESSION_MAX_AGE", 86400), // 24 hours
		},
		Security: SecurityConfig{
			RateLimitRPS:   getEnvAsInt("RATE_LIMIT_RPS", 100),
			RateLimitBurst: getEnvAsInt("RATE_LIMIT_BURST", 200),
			CORSOrigins:    getEnvAsSlice("CORS_ORIGINS", []string{"http://localhost:5173"}),
			CSPPolicy:      getEnv("CSP_POLICY", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"),
		},
		Frontend: FrontendConfig{
			URL: getEnv("FRONTEND_URL", "http://localhost:5173"),
		},
	}

	// Validate required configuration
	if err := config.Validate(); err != nil {
		return nil, fmt.Errorf("invalid configuration: %w", err)
	}

	return config, nil
}

// Validate validates the configuration
func (c *Config) Validate() error {
	if c.JWT.SigningKey == "" {
		return fmt.Errorf("JWT_SIGNING_KEY is required")
	}

	if c.Database.Password == "" && c.Server.Environment == "production" {
		return fmt.Errorf("DB_PASSWORD is required in production")
	}

	if c.WebAuthn.RPID == "" {
		return fmt.Errorf("WEBAUTHN_RP_ID is required")
	}

	if len(c.WebAuthn.RPOrigins) == 0 {
		return fmt.Errorf("WEBAUTHN_RP_ORIGINS is required")
	}

	// Validate OAuth configuration
	if c.OAuth.SessionSecret == "" {
		return fmt.Errorf("OAUTH_SESSION_SECRET is required")
	}

	// Validate OAuth providers if enabled
	if c.OAuth.Google.Enabled && (c.OAuth.Google.ClientID == "" || c.OAuth.Google.ClientSecret == "") {
		return fmt.Errorf("Google OAuth enabled but OAUTH_GOOGLE_CLIENT_ID or OAUTH_GOOGLE_CLIENT_SECRET is missing")
	}

	if c.OAuth.GitHub.Enabled && (c.OAuth.GitHub.ClientID == "" || c.OAuth.GitHub.ClientSecret == "") {
		return fmt.Errorf("GitHub OAuth enabled but OAUTH_GITHUB_CLIENT_ID or OAUTH_GITHUB_CLIENT_SECRET is missing")
	}

	if c.OAuth.Microsoft.Enabled && (c.OAuth.Microsoft.ClientID == "" || c.OAuth.Microsoft.ClientSecret == "") {
		return fmt.Errorf("Microsoft OAuth enabled but OAUTH_MICROSOFT_CLIENT_ID or OAUTH_MICROSOFT_CLIENT_SECRET is missing")
	}

	return nil
}

// GetDatabaseURL returns the PostgreSQL connection URL
func (c *Config) GetDatabaseURL() string {
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		c.Database.Host,
		c.Database.Port,
		c.Database.User,
		c.Database.Password,
		c.Database.Name,
		c.Database.SSLMode,
	)
}

// IsDevelopment returns true if the environment is development
func (c *Config) IsDevelopment() bool {
	return c.Server.Environment == "development"
}

// IsProduction returns true if the environment is production
func (c *Config) IsProduction() bool {
	return c.Server.Environment == "production"
}

// IsStaging returns true if the environment is staging
func (c *Config) IsStaging() bool {
	return c.Server.Environment == "staging"
}

// GetServerAddress returns the server address
func (c *Config) GetServerAddress() string {
	return fmt.Sprintf("%s:%d", c.Server.Host, c.Server.Port)
}

// GetServerURL returns the full server URL including protocol
func (c *Config) GetServerURL() string {
	return c.Server.URL
}

// Helper functions for environment variable parsing

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}

func getEnvAsSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		// Split comma-separated values and trim spaces
		parts := []string{}
		for _, part := range strings.Split(value, ",") {
			trimmed := strings.TrimSpace(part)
			if trimmed != "" {
				parts = append(parts, trimmed)
			}
		}
		if len(parts) > 0 {
			return parts
		}
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}
