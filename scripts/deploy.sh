#!/bin/bash

# ============================================
# Social Foger - Deployment Script
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
DEPLOY_ENV=${1:-production}
PROJECT_DIR="/var/www/socialforge"
BACKUP_DIR="/var/backups/socialforge"
COMPOSE_FILE="docker-compose.prod.yml"

# Functions
print_message() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo ""
    print_message "$CYAN" "=========================================="
    print_message "$CYAN" "$1"
    print_message "$CYAN" "=========================================="
    echo ""
}

print_success() {
    print_message "$GREEN" "✓ $1"
}

print_error() {
    print_message "$RED" "✗ $1"
}

print_warning() {
    print_message "$YELLOW" "⚠ $1"
}

print_info() {
    print_message "$BLUE" "ℹ $1"
}

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run this script with sudo"
    exit 1
fi

print_header "Social Foger Deployment - $DEPLOY_ENV"

# Navigate to project directory
cd "$PROJECT_DIR" || {
    print_error "Project directory not found: $PROJECT_DIR"
    exit 1
}

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Backup database
print_info "Creating database backup..."
BACKUP_FILE="$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"
print_success "Database backed up to: $BACKUP_FILE"

# Backup uploaded files (MinIO)
print_info "Creating file backup..."
MINIO_BACKUP_FILE="$BACKUP_DIR/minio_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
docker run --rm --volumes-from socialforge-minio-prod -v "$BACKUP_DIR":/backup alpine tar czf /backup/minio_backup_$(date +%Y%m%d_%H%M%S).tar.gz /data
print_success "Files backed up to: $MINIO_BACKUP_FILE"

# Pull latest changes from Git
print_info "Pulling latest changes..."
git fetch origin
git pull origin main
print_success "Code updated"

# Pull latest Docker images
print_info "Pulling latest Docker images..."
docker-compose -f "$COMPOSE_FILE" pull
print_success "Images updated"

# Stop services gracefully
print_info "Stopping services..."
docker-compose -f "$COMPOSE_FILE" stop frontend backend worker
print_success "Services stopped"

# Run database migrations
print_info "Running database migrations..."
docker-compose -f "$COMPOSE_FILE" run --rm backend /app/migrate -path /app/database/migrations -database "$DATABASE_URL" up
print_success "Migrations completed"

# Start services
print_info "Starting services..."
docker-compose -f "$COMPOSE_FILE" up -d
print_success "Services started"

# Wait for services to be healthy
print_info "Waiting for services to be healthy..."
sleep 15

# Health check
print_info "Performing health check..."
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)
if [ "$BACKEND_HEALTH" -eq 200 ]; then
    print_success "Backend is healthy"
else
    print_error "Backend health check failed (HTTP $BACKEND_HEALTH)"
    print_warning "Rolling back..."
    docker-compose -f "$COMPOSE_FILE" down
    docker-compose -f "$COMPOSE_FILE" up -d
    exit 1
fi

FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_HEALTH" -eq 200 ]; then
    print_success "Frontend is healthy"
else
    print_error "Frontend health check failed (HTTP $FRONTEND_HEALTH)"
    print_warning "Rolling back..."
    docker-compose -f "$COMPOSE_FILE" down
    docker-compose -f "$COMPOSE_FILE" up -d
    exit 1
fi

# Clean up old Docker images
print_info "Cleaning up old Docker images..."
docker image prune -f
print_success "Cleanup completed"

# Clean up old backups (keep last 7 days)
print_info "Cleaning up old backups..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
print_success "Old backups removed"

# Display running containers
print_header "Deployment Status"
docker-compose -f "$COMPOSE_FILE" ps

# Show logs
print_info "Recent logs:"
docker-compose -f "$COMPOSE_FILE" logs --tail=20 backend frontend

print_header "Deployment Complete!"
print_success "Social Foger has been deployed successfully!"
echo ""
print_info "Backup locations:"
echo "  Database: $BACKUP_FILE"
echo "  Files: $MINIO_BACKUP_FILE"
echo ""
print_info "Services:"
echo "  Backend: http://localhost:8080"
echo "  Frontend: http://localhost:3000"
echo "  Grafana: http://localhost:3001"
echo ""
print_warning "Next steps:"
echo "  1. Verify the application is working correctly"
echo "  2. Check logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "  3. Monitor metrics in Grafana"
echo ""