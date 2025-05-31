# Define variables
IMAGE_NAME := 2fair-server
CONTAINER_NAME := 2fair-server-container
PORT := 8080
ENV_FILE := .env

# Help command
.PHONY: help
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  make %-15s %s\n", $$1, $$2}'

# Run server locally
.PHONY: run
run: ## Run the server locally
	@echo "Running server locally..."
	go run cmd/server/*.go

# Build Docker image
.PHONY: docker-build
docker-build: ## Build the Docker image
	@echo "Building Docker image..."
	docker build -t $(IMAGE_NAME):latest .

# Run Docker container
.PHONY: docker-run
docker-run: ## Run the Docker container
	@echo "Running Docker container..."
	docker run -p $(PORT):$(PORT) --env-file $(ENV_FILE) --name $(CONTAINER_NAME) $(IMAGE_NAME):latest

# Stop Docker container
.PHONY: docker-stop
docker-stop: ## Stop the Docker container
	@echo "Stopping Docker container..."
	docker stop $(CONTAINER_NAME)

# Remove Docker container
.PHONY: docker-remove
docker-remove: ## Remove the Docker container
	@echo "Removing Docker container..."
	docker rm $(CONTAINER_NAME)

# Clean up Docker
.PHONY: docker-clean
docker-clean: docker-stop docker-remove ## Stop and remove the Docker container

# Show logs
.PHONY: logs
logs: ## Show logs of the running container
	docker logs -f $(CONTAINER_NAME)

# Make clean command
.PHONY: clean
clean: ## Clean the build environment
	@echo "Cleaning build environment..."
	go clean
	rm -rf build

# Make build command
.PHONY: build
build: ## Build the Go application
	@echo "Building the application..."
	go build -o build/main cmd/server/*.go

# Deploy to fly.io
.PHONY: deploy
deploy: ## Deploy the application to fly.io
	@echo "Deploying to fly.io..."
	fly deploy

# Generate API documentation
.PHONY: docs
docs: ## Generate API documentation
	@echo "Generating API documentation..."
	swag init -g cmd/server/*.go

sqlc:
	sqlc generate

migrate-up: ## Run database migrations up
	@echo "Running database migrations up..."
	@if [ -f .env ]; then \
		export $$(cat .env | grep -v '^#' | xargs) && \
		migrate -path internal/adapter/repository/postgres/migrations \
		-database "postgres://$${DB_USER}:$${DB_PASSWORD}@$${DB_HOST}:$${DB_PORT}/$${DB_NAME}?sslmode=$${DB_SSL_MODE}" \
		-verbose up; \
	else \
		echo "Error: .env file not found"; \
		exit 1; \
	fi

migrate-down: ## Run database migrations down
	@echo "Running database migrations down..."
	@if [ -f .env ]; then \
		export $$(cat .env | grep -v '^#' | xargs) && \
		migrate -path internal/adapter/repository/postgres/migrations \
		-database "postgres://$${DB_USER}:$${DB_PASSWORD}@$${DB_HOST}:$${DB_PORT}/$${DB_NAME}?sslmode=$${DB_SSL_MODE}" \
		-verbose down; \
	else \
		echo "Error: .env file not found"; \
		exit 1; \
	fi

migrate-create: ## Create a new migration file
	@if [ -z "$(name)" ]; then \
		echo "Error: Please provide a migration name using 'make migrate-create name=your_migration_name'"; \
		exit 1; \
	fi
	migrate create -ext sql -dir internal/adapter/repository/postgres/migrations -seq $(name)