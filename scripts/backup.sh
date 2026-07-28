#!/usr/bin/env bash
#
# Scheduled backup for Social Forge: Postgres dump + MinIO object mirror.
# Intended to run from cron on the host or a sidecar container.
#
#   0 3 * * *  /opt/socialforge/scripts/backup.sh >> /var/log/sf-backup.log 2>&1
#
# Required env (or edit below):
#   PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE
#   MINIO_ALIAS (an `mc` alias already configured) MINIO_BUCKET
#   BACKUP_DIR (default /var/backups/socialforge)
#   RETENTION_DAYS (default 14)
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/socialforge}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR/db" "$BACKUP_DIR/minio"

echo "[$(date -Is)] starting backup $STAMP"

# --- Postgres -----------------------------------------------------------------
DB_FILE="$BACKUP_DIR/db/socialforge-$STAMP.sql.gz"
PGPASSWORD="${PGPASSWORD:-}" pg_dump \
  --host="${PGHOST:-localhost}" \
  --port="${PGPORT:-5432}" \
  --username="${PGUSER:-postgres}" \
  --no-owner --clean --if-exists \
  "${PGDATABASE:-socialforge}" | gzip > "$DB_FILE"
echo "[$(date -Is)] db dump → $DB_FILE ($(du -h "$DB_FILE" | cut -f1))"

# --- MinIO objects ------------------------------------------------------------
# Requires the MinIO client `mc` with an alias already set:
#   mc alias set "$MINIO_ALIAS" https://minio.example.com ACCESS SECRET
if command -v mc >/dev/null 2>&1; then
  mc mirror --overwrite --remove \
    "${MINIO_ALIAS:-minio}/${MINIO_BUCKET:-socialforge}" \
    "$BACKUP_DIR/minio/${MINIO_BUCKET:-socialforge}"
  echo "[$(date -Is)] minio mirror complete"
else
  echo "[$(date -Is)] WARNING: mc not found, skipping MinIO mirror"
fi

# --- Retention ----------------------------------------------------------------
find "$BACKUP_DIR/db" -name '*.sql.gz' -mtime "+$RETENTION_DAYS" -delete
echo "[$(date -Is)] pruned db dumps older than ${RETENTION_DAYS}d"

echo "[$(date -Is)] backup $STAMP done"
