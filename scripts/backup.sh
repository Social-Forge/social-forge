#!/bin/bash

# ============================================
# Social Forge - Backup Script
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/var/www/socialforge"
BACKUP_DIR="/var/backups/socialforge"
REMOTE_BACKUP_DIR=${REMOTE_BACKUP_DIR:-""}  # Set this for remote backups (S3, etc.)
RETENTION_DAYS=${RETENTION_DAYS:-30}
COMPOSE_FILE="docker-compose.prod.yml"

# Load environment variables
if [ -f "$PROJECT_DIR/.env" ]; then
    export $(cat "$PROJECT_DIR/.env" | grep -v '#' | xargs)
fi

# Functions
print_message() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

print_success() {
    print_message "$GREEN" "✓ $1"
}

print_error() {
    print_message "$RED" "✗ $1"
}

print_info() {
    print_message "$CYAN" "ℹ $1"
}

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run this script with sudo"
    exit 1
fi

print_info "Starting backup process..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL database
print_info "Backing up PostgreSQL database..."
DB_BACKUP_FILE="$BACKUP_DIR/postgres_${TIMESTAMP}.sql.gz"

cd "$PROJECT_DIR"
docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --format=custom \
    --compress=9 \
    | gzip > "$DB_BACKUP_FILE"

if [ -f "$DB_BACKUP_FILE" ]; then
    SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f1)
    print_success "Database backup created: $DB_BACKUP_FILE ($SIZE)"
else
    print_error "Database backup failed"
    exit 1
fi

# Backup MinIO data
print_info "Backing up MinIO data..."
MINIO_BACKUP_FILE="$BACKUP_DIR/minio_${TIMESTAMP}.tar.gz"

docker run --rm \
    --volumes-from socialforge-minio-prod \
    -v "$BACKUP_DIR":/backup \
    alpine tar czf "/backup/minio_${TIMESTAMP}.tar.gz" /data

if [ -f "$MINIO_BACKUP_FILE" ]; then
    SIZE=$(du -h "$MINIO_BACKUP_FILE" | cut -f1)
    print_success "MinIO backup created: $MINIO_BACKUP_FILE ($SIZE)"
else
    print_error "MinIO backup failed"
    exit 1
fi

# Backup Redis data (optional, if persistent)
print_info "Backing up Redis data..."
REDIS_BACKUP_FILE="$BACKUP_DIR/redis_${TIMESTAMP}.rdb"

docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli SAVE
docker cp socialforge-redis-prod:/data/dump.rdb "$REDIS_BACKUP_FILE"

if [ -f "$REDIS_BACKUP_FILE" ]; then
    gzip "$REDIS_BACKUP_FILE"
    SIZE=$(du -h "${REDIS_BACKUP_FILE}.gz" | cut -f1)
    print_success "Redis backup created: ${REDIS_BACKUP_FILE}.gz ($SIZE)"
else
    print_info "Redis backup skipped (no data)"
fi

# Backup environment and configuration files
print_info "Backing up configuration files..."
CONFIG_BACKUP_FILE="$BACKUP_DIR/config_${TIMESTAMP}.tar.gz"

tar czf "$CONFIG_BACKUP_FILE" \
    -C "$PROJECT_DIR" \
    .env \
    docker-compose.prod.yml \
    docker/nginx/conf.d/ \
    docker/centrifugo/config.json \
    2>/dev/null || print_info "Some config files not found"

if [ -f "$CONFIG_BACKUP_FILE" ]; then
    SIZE=$(du -h "$CONFIG_BACKUP_FILE" | cut -f1)
    print_success "Configuration backup created: $CONFIG_BACKUP_FILE ($SIZE)"
fi

# Create backup manifest
MANIFEST_FILE="$BACKUP_DIR/manifest_${TIMESTAMP}.txt"
cat > "$MANIFEST_FILE" << EOF
Social Forge Backup Manifest
============================
Timestamp: $(date)
Environment: ${APP_ENV:-production}

Files:
- Database: $(basename "$DB_BACKUP_FILE") ($(du -h "$DB_BACKUP_FILE" | cut -f1))
- MinIO: $(basename "$MINIO_BACKUP_FILE") ($(du -h "$MINIO_BACKUP_FILE" | cut -f1))
- Redis: $(basename "${REDIS_BACKUP_FILE}.gz") ($(du -h "${REDIS_BACKUP_FILE}.gz" 2>/dev/null | cut -f1 || echo "N/A"))
- Config: $(basename "$CONFIG_BACKUP_FILE") ($(du -h "$CONFIG_BACKUP_FILE" | cut -f1))

Database Info:
- Host: ${DB_HOST}
- Database: ${DB_NAME}
- Tables: $(docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | tr -d ' ')

Docker Images:
$(docker compose -f "$COMPOSE_FILE" images)

Disk Usage:
$(df -h "$BACKUP_DIR")
EOF

print_success "Manifest created: $MANIFEST_FILE"

# Upload to remote storage (if configured)
if [ -n "$REMOTE_BACKUP_DIR" ]; then
    print_info "Uploading backups to remote storage..."
    
    # Example for AWS S3
    # aws s3 sync "$BACKUP_DIR" "$REMOTE_BACKUP_DIR" --exclude "*" --include "*${TIMESTAMP}*"
    
    # Example for rsync
    # rsync -avz "$BACKUP_DIR/" "$REMOTE_BACKUP_DIR/"
    
    print_info "Remote backup upload skipped (configure REMOTE_BACKUP_DIR)"
fi

# Clean up old backups
print_info "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "postgres_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "minio_*.tar.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "redis_*.rdb.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "config_*.tar.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "manifest_*.txt" -mtime +$RETENTION_DAYS -delete
print_success "Old backups cleaned up"

# Display summary
echo ""
print_success "Backup completed successfully!"
echo ""
print_info "Backup Summary:"
echo "  Location: $BACKUP_DIR"
echo "  Timestamp: $TIMESTAMP"
echo "  Total Size: $(du -sh "$BACKUP_DIR" | cut -f1)"
echo ""
print_info "Files created:"
echo "  - $DB_BACKUP_FILE"
echo "  - $MINIO_BACKUP_FILE"
echo "  - ${REDIS_BACKUP_FILE}.gz"
echo "  - $CONFIG_BACKUP_FILE"
echo "  - $MANIFEST_FILE"
echo ""
print_info "Retention: Backups older than $RETENTION_DAYS days will be automatically deleted"
echo ""

# Verify backups
print_info "Verifying backups..."
if gzip -t "$DB_BACKUP_FILE" 2>/dev/null; then
    print_success "Database backup is valid"
else
    print_error "Database backup is corrupted!"
fi

if tar -tzf "$MINIO_BACKUP_FILE" >/dev/null 2>&1; then
    print_success "MinIO backup is valid"
else
    print_error "MinIO backup is corrupted!"
fi

echo ""
print_info "To restore from this backup, use: ./scripts/restore.sh $TIMESTAMP"
echo ""