# 2FAir E2E Encrypted TOTP Vault - Backend Makefile

# Variables
BINARY_NAME=2fair-server
MAIN_PATH=./cmd/server
BUILD_DIR=./bin
MIGRATION_DIR=./internal/infrastructure/database/migrations

# Default target
.PHONY: help
help: ## Show this help message
	@echo "2FAir Backend - Available commands:"
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) }' $(MAKEFILE_LIST)

##@ Development
.PHONY: build
build: ## Build the application
	@echo "Building $(BINARY_NAME)..."
	@mkdir -p $(BUILD_DIR)
	@go build -o $(BUILD_DIR)/$(BINARY_NAME) $(MAIN_PATH)
	@echo "Build complete: $(BUILD_DIR)/$(BINARY_NAME)"

.PHONY: run
run: ## Run the application
	@echo "Running $(BINARY_NAME)..."
	@go run $(MAIN_PATH)

.PHONY: dev
dev: ## Run the application in development mode with auto-reload
	@echo "Starting development server..."
	@if command -v air > /dev/null 2>&1; then \
		air; \
	else \
		echo "Air not found. Installing air for hot reload..."; \
		go install github.com/air-verse/air@latest; \
		air; \
	fi

.PHONY: clean
clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	@rm -rf $(BUILD_DIR)
	@go clean

##@ Dependencies
.PHONY: deps
deps: ## Download and tidy dependencies
	@echo "Downloading dependencies..."
	@go mod download
	@go mod tidy

.PHONY: deps-upgrade
deps-upgrade: ## Upgrade all dependencies
	@echo "Upgrading dependencies..."
	@go get -u ./...
	@go mod tidy

##@ Database
.PHONY: db-up
db-up: ## Start database services
	@echo "Starting database services..."
	@docker-compose -f docker-compose.dev.yaml up postgres redis -d

.PHONY: db-down
db-down: ## Stop database services
	@echo "Stopping database services..."
	@docker-compose -f docker-compose.dev.yaml down

.PHONY: db-migrate-up
db-migrate-up: ## Run database migrations
	@echo "Running database migrations..."
	@go run $(MAIN_PATH) -migrate up

.PHONY: db-migrate-down
db-migrate-down: ## Rollback database migrations
	@echo "Rolling back database migrations..."
	@go run $(MAIN_PATH) -migrate down

.PHONY: db-migrate-status
db-migrate-status: ## Show database migration status
	@echo "Database migration status:"
	@go run $(MAIN_PATH) -migrate status

.PHONY: db-reset
db-reset: db-down db-up ## Reset database (down and up)
	@echo "Database reset complete"

##@ Testing
.PHONY: test
test: ## Run all tests
	@echo "Running all tests..."
	@go test -v ./...

.PHONY: test-unit
test-unit: ## Run unit tests only (fast)
	@echo "Running unit tests..."
	@go test -short -v ./...

.PHONY: test-integration
test-integration: ## Run integration tests (requires Docker)
	@echo "Running integration tests..."
	@echo "Note: Integration tests require Docker to be running"
	@go test -v ./internal/test/...

.PHONY: test-cover
test-cover: ## Run tests with coverage
	@echo "Running tests with coverage..."
	@go test -v -coverprofile=coverage.out ./...
	@go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

.PHONY: test-cover-unit
test-cover-unit: ## Run unit tests with coverage
	@echo "Running unit tests with coverage..."
	@go test -short -v -coverprofile=coverage-unit.out ./...
	@go tool cover -html=coverage-unit.out -o coverage-unit.html
	@echo "Unit test coverage report generated: coverage-unit.html"

.PHONY: test-phase1
test-phase1: ## Run Phase 1 tests (Domain entities, Config, Database)
	@echo "Running Phase 1 tests..."
	@go test -v -run "TestConfig|TestUser|TestWebAuthnCredential|TestNewUser|TestUser_" ./internal/test/... ./internal/domain/entities/...

.PHONY: test-phase2
test-phase2: ## Run Phase 2 tests (Authentication, JWT, WebAuthn services)
	@echo "Running Phase 2 tests..."
	@go test -v -run "TestAuth|TestJWT|TestWebAuthn|TestNewAuth|TestAuth_" ./internal/infrastructure/services/...

.PHONY: test-watch
test-watch: ## Run tests in watch mode (requires entr)
	@echo "Running tests in watch mode..."
	@if command -v entr > /dev/null 2>&1; then \
		find . -name "*.go" | entr -c go test -short -v ./...; \
	else \
		echo "entr not found. Install with: brew install entr (macOS) or apt-get install entr (Ubuntu)"; \
		echo "Running tests once..."; \
		go test -short -v ./...; \
	fi

.PHONY: test-verbose
test-verbose: ## Run tests with verbose output and race detection
	@echo "Running tests with verbose output and race detection..."
	@go test -v -race -timeout 30s ./...

.PHONY: test-bench
test-bench: ## Run benchmark tests
	@echo "Running benchmark tests..."
	@go test -bench=. -benchmem ./...

##@ Code Quality

.PHONY: lint
lint: ## Run linter
	@echo "Running linter..."
	@if command -v golangci-lint > /dev/null 2>&1; then \
		golangci-lint run; \
	else \
		echo "golangci-lint not found. Installing..."; \
		go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest; \
		golangci-lint run; \
	fi

.PHONY: fmt
fmt: ## Format code
	@echo "Formatting code..."
	@go fmt ./...
	@goimports -w .

##@ Code Generation
.PHONY: generate
generate: ## Generate code (SQLC, etc.)
	@echo "Generating code..."
	@sqlc generate

.PHONY: sqlc-init
sqlc-init: ## Initialize SQLC (run once)
	@echo "Initializing SQLC..."
	@sqlc init

##@ Docker
.PHONY: docker-build
docker-build: ## Build Docker image
	@echo "Building Docker image..."
	@docker build -t 2fair-backend:latest .

.PHONY: docker-run
docker-run: ## Run application in Docker
	@echo "Starting application with Docker Compose..."
	@docker-compose -f docker-compose.dev.yaml up --build

.PHONY: docker-down
docker-down: ## Stop Docker containers
	@echo "Stopping Docker containers..."
	@docker-compose -f docker-compose.dev.yaml down

.PHONY: docker-logs
docker-logs: ## Show Docker logs
	@docker-compose -f docker-compose.dev.yaml logs -f backend

##@ Production
.PHONY: build-prod
build-prod: ## Build for production
	@echo "Building for production..."
	@mkdir -p $(BUILD_DIR)
	@CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o $(BUILD_DIR)/$(BINARY_NAME) $(MAIN_PATH)
	@echo "Production build complete: $(BUILD_DIR)/$(BINARY_NAME)"

##@ Utilities
.PHONY: swagger
swagger: ## Generate Swagger documentation
	@echo "Generating Swagger documentation..."
	@if command -v swag > /dev/null 2>&1; then \
		swag init -g $(MAIN_PATH)/main.go -o ./docs; \
	else \
		echo "swag not found. Installing..."; \
		go install github.com/swaggo/swag/cmd/swag@latest; \
		swag init -g $(MAIN_PATH)/main.go -o ./docs; \
	fi

.PHONY: install-tools
install-tools: ## Install development tools
	@echo "Installing development tools..."
	@go install github.com/air-verse/air@latest
	@go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@go install github.com/swaggo/swag/cmd/swag@latest
	@go install golang.org/x/tools/cmd/goimports@latest

.PHONY: check
check: fmt lint test ## Run all checks (format, lint, test)

.PHONY: all
all: clean deps generate build test ## Full build pipeline