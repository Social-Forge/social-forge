#!/bin/sh
set -e

echo "[web] running database migrations..."
node ace migration:run --force

echo "[web] starting HTTP server on :${PORT:-3333}"
exec node bin/server.js
