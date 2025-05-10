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

migrate-up:
	migrate -path db/migrations -database "${DB_URL}" -verbose up

migrate-down:
	migrate -path db/migrations -database "${DB_URL}" -verbose down

migrate-create:
	migrate create -ext sql -dir db/migrations -seq $(name)