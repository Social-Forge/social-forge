# Social Foger Backend Makefile
# =================================

.PHONY: help

# Variables
APP_NAME=socialfoger
VERSION?=$(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
BUILD_TIME=$(shell date -u '+%Y-%m-%d_%H:%M:%S')
GO_VERSION=$(shell go version | awk '{print $$3}')
MIGRATION_DIR=database/migrations
SEEDER_DIR=database/seeders

# Docker variables
DOCKER_COMPOSE=docker compose
DOCKER_COMPOSE_PROD=docker compose -f docker-compose.prod.yml

# Database variables
DB_HOST?=localhost
DB_PORT?=5432
DB_USER?=socialforge
DB_PASSWORD?=JombSky@2305Ryan
DB_NAME?=socialforge_db
DB_SSL_MODE?=disable
DB_URL=postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=$(DB_SSL_MODE)

# Colors for output
CYAN=\033[0;36m
GREEN=\033[0;32m
YELLOW=\033[0;33m
RED=\033[0;31m
NC=\033[0m # No Color

## help: Display this help message
help:
	@echo "$(CYAN)Social Foger - Backend Makefile Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Available commands:$(NC)"
	@awk 'BEGIN {FS = ":.*##"; printf ""} /^[a-zA-Z_-]+:.*?##/ { printf "  $(CYAN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

## run: Run the application in development mode
run:
	@echo "$(GREEN)Starting application...$(NC)"
	@air -c .air.toml

## dev: Run the application with hot reload
dev:
	@echo "$(GREEN)Starting development server with hot reload...$(NC)"
	@air -c .air.toml

## build: Build the application binaries
build:
	@echo "$(GREEN)Building application...$(NC)"
	@CGO_ENABLED=0 go build -ldflags="-w -s -X main.Version=$(VERSION) -X main.BuildTime=$(BUILD_TIME)" -o bin/api cmd/api/main.go
	@CGO_ENABLED=0 go build -ldflags="-w -s -X main.Version=$(VERSION) -X main.BuildTime=$(BUILD_TIME)" -o bin/worker cmd/worker/main.go
	@CGO_ENABLED=0 go build -ldflags="-w -s -X main.Version=$(VERSION) -X main.BuildTime=$(BUILD_TIME)" -o bin/migrate cmd/migrate/main.go
	@echo "$(GREEN)Build complete! Binaries available in bin/$(NC)"

## clean: Clean build artifacts
clean:
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	@rm -rf bin/ tmp/ *.log
	@echo "$(GREEN)Clean complete!$(NC)"

##@ Dependencies

## deps: Download Go dependencies
deps:
	@echo "$(GREEN)Downloading dependencies...$(NC)"
	@go mod download
	@go mod verify

## tidy: Tidy Go dependencies
tidy:
	@echo "$(GREEN)Tidying dependencies...$(NC)"
	@go mod tidy

## vendor: Vendor dependencies
vendor:
	@echo "$(GREEN)Vendoring dependencies...$(NC)"
	@go mod vendor

##@ Database

## db-create: Create database
db-create:
	@echo "$(GREEN)Creating database $(DB_NAME)...$(NC)"
	@PGPASSWORD=$(DB_PASSWORD) psql -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) -tc "SELECT 1 FROM pg_database WHERE datname = '$(DB_NAME)'" | grep -q 1 || \
		PGPASSWORD=$(DB_PASSWORD) psql -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) -c "CREATE DATABASE $(DB_NAME)"
	@echo "$(GREEN)Database created!$(NC)"

## db-drop: Drop database (DANGER!)
db-drop:
	@echo "$(RED)Dropping database $(DB_NAME)...$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		PGPASSWORD=$(DB_PASSWORD) psql -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) -c "DROP DATABASE IF EXISTS $(DB_NAME)"; \
		echo "$(GREEN)Database dropped!$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled!$(NC)"; \
	fi

## migrate-create: Create new migration file (usage: make migrate-create name=create_users_table)
migrate-create:
	@if [ -z "$(name)" ]; then \
		echo "$(RED)Error: Please provide migration name (e.g., make migrate-create name=create_users_table)$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Creating migration: $(name)$(NC)"
	@migrate create -ext sql -dir $(MIGRATION_DIR) -seq $(name)
	@echo "$(GREEN)Migration files created in $(MIGRATION_DIR)$(NC)"

## migrate-up: Run all pending migrations
migrate-up:
	@echo "$(GREEN)Running migrations...$(NC)"
	@migrate -path $(MIGRATION_DIR) -database "$(DB_URL)" up
	@echo "$(GREEN)Migrations complete!$(NC)"

## migrate-down: Rollback last migration
migrate-down:
	@echo "$(YELLOW)Rolling back last migration...$(NC)"
	@migrate -path $(MIGRATION_DIR) -database "$(DB_URL)" down 1
	@echo "$(GREEN)Rollback complete!$(NC)"

## migrate-down-all: Rollback all migrations (DANGER!)
migrate-down-all:
	@echo "$(RED)Rolling back ALL migrations...$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		migrate -path $(MIGRATION_DIR) -database "$(DB_URL)" down -all; \
		echo "$(GREEN)All migrations rolled back!$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled!$(NC)"; \
	fi

## migrate-force: Force migration version (usage: make migrate-force version=1)
migrate-force:
	@if [ -z "$(version)" ]; then \
		echo "$(RED)Error: Please provide version (e.g., make migrate-force version=1)$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Forcing migration version to $(version)...$(NC)"
	@migrate -path $(MIGRATION_DIR) -database "$(DB_URL)" force $(version)
	@echo "$(GREEN)Version forced!$(NC)"

## migrate-version: Show current migration version
migrate-version:
	@echo "$(CYAN)Current migration version:$(NC)"
	@migrate -path $(MIGRATION_DIR) -database "$(DB_URL)" version

## migrate-reset: Reset database (down all, then up)
migrate-reset: migrate-down-all migrate-up
	@echo "$(GREEN)Database reset complete!$(NC)"

## seed: Run database seeders
seed:
	@echo "$(GREEN)Running seeders...$(NC)"
	@go run $(SEEDER_DIR)/seeder.go
	@echo "$(GREEN)Seeding complete!$(NC)"

## db-reset: Drop, create, migrate and seed database
db-reset: db-drop db-create migrate-up seed
	@echo "$(GREEN)Database reset complete!$(NC)"

##@ Testing

## test: Run tests
test:
	@echo "$(GREEN)Running tests...$(NC)"
	@go test -v -race -coverprofile=coverage.out ./...

## test-coverage: Run tests with coverage report
test-coverage: test
	@echo "$(GREEN)Generating coverage report...$(NC)"
	@go tool cover -html=coverage.out -o coverage.html
	@echo "$(GREEN)Coverage report generated: coverage.html$(NC)"

## test-unit: Run unit tests only
test-unit:
	@echo "$(GREEN)Running unit tests...$(NC)"
	@go test -v -short -race ./...

## test-integration: Run integration tests only
test-integration:
	@echo "$(GREEN)Running integration tests...$(NC)"
	@go test -v -run Integration ./...

##@ Code Quality

## lint: Run linter
lint:
	@echo "$(GREEN)Running linter...$(NC)"
	@if command -v golangci-lint >/dev/null 2>&1; then \
		golangci-lint run --timeout 5m; \
	else \
		echo "$(YELLOW)golangci-lint not installed. Installing...$(NC)"; \
		go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest; \
		golangci-lint run --timeout 5m; \
	fi

## fmt: Format code
fmt:
	@echo "$(GREEN)Formatting code...$(NC)"
	@go fmt ./...
	@gofmt -s -w .

## vet: Run go vet
vet:
	@echo "$(GREEN)Running go vet...$(NC)"
	@go vet ./...

## check: Run all checks (fmt, vet, lint)
check: fmt vet lint
	@echo "$(GREEN)All checks passed!$(NC)"

##@ Docker

## docker-build: Build Docker images
docker-build:
	@echo "$(GREEN)Building Docker images...$(NC)"
	@$(DOCKER_COMPOSE) build

## docker-up: Start Docker containers
docker-up:
	@echo "$(GREEN)Starting Docker containers...$(NC)"
	@$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)Containers started!$(NC)"

## docker-down: Stop Docker containers
docker-down:
	@echo "$(YELLOW)Stopping Docker containers...$(NC)"
	@$(DOCKER_COMPOSE) down
	@echo "$(GREEN)Containers stopped!$(NC)"

## docker-logs: View Docker logs
docker-logs:
	@$(DOCKER_COMPOSE) logs -f

## docker-restart: Restart Docker containers
docker-restart:
	@echo "$(YELLOW)Restarting Docker containers...$(NC)"
	@$(DOCKER_COMPOSE) restart
	@echo "$(GREEN)Containers restarted!$(NC)"

## docker-clean: Remove Docker containers and volumes
docker-clean:
	@echo "$(RED)Removing Docker containers and volumes...$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(DOCKER_COMPOSE) down -v; \
		echo "$(GREEN)Cleanup complete!$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled!$(NC)"; \
	fi

## docker-prod-build: Build production Docker images
docker-prod-build:
	@echo "$(GREEN)Building production Docker images...$(NC)"
	@$(DOCKER_COMPOSE_PROD) build

## docker-prod-up: Start production Docker containers
docker-prod-up:
	@echo "$(GREEN)Starting production Docker containers...$(NC)"
	@$(DOCKER_COMPOSE_PROD) up -d
	@echo "$(GREEN)Production containers started!$(NC)"

## docker-prod-down: Stop production Docker containers
docker-prod-down:
	@echo "$(YELLOW)Stopping production Docker containers...$(NC)"
	@$(DOCKER_COMPOSE_PROD) down
	@echo "$(GREEN)Production containers stopped!$(NC)"

##@ Utilities

## install-tools: Install development tools
install-tools:
	@echo "$(GREEN)Installing development tools...$(NC)"
	@go install github.com/air-verse/air@latest
	@go install github.com/swaggo/swag/cmd/swag@latest
	@go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@echo "$(GREEN)Tools installed!$(NC)"

## swag: Generate Swagger documentation
swag:
	@echo "$(GREEN)Generating Swagger documentation...$(NC)"
	@swag init -g cmd/api/main.go -o docs
	@echo "$(GREEN)Swagger documentation generated!$(NC)"

## version: Show version information
version:
	@echo "$(CYAN)Application Version:$(NC) $(VERSION)"
	@echo "$(CYAN)Build Time:$(NC) $(BUILD_TIME)"
	@echo "$(CYAN)Go Version:$(NC) $(GO_VERSION)"

## setup: Initial project setup
setup: install-tools deps db-create migrate-up seed
	@echo "$(GREEN)Project setup complete!$(NC)"
	@echo "$(CYAN)Run 'make dev' to start development server$(NC)"

.DEFAULT_GOAL := help