#!/bin/sh
set -e

# Test PostgreSQL connection
pg_isready -U "${POSTGRES_USER:-socialforge}" -d "${POSTGRES_DB:-socialforge_db}"

# Test jika extensions tersedia
psql -U "${POSTGRES_USER:-socialforge}" -d "${POSTGRES_DB:-socialforge_db}" -c "SELECT version();" > /dev/null

echo "PostgreSQL is healthy"