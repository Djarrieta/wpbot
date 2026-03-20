#!/bin/bash
set -e

echo "🛑 Stopping database container..."
sudo podman stop wpbot-db 2>/dev/null || true
sudo podman rm wpbot-db 2>/dev/null || true

echo "🗑️  Removing old data..."
sudo rm -rf ./pgdata
mkdir -p ./pgdata

echo "🚀 Starting PostgreSQL container..."
sudo podman run -d \
  --name wpbot-db \
  -e POSTGRES_USER=wpbot \
  -e POSTGRES_PASSWORD=wpbot \
  -e POSTGRES_DB=wpbot \
  -e PGDATA=/var/lib/postgresql/data/pgdata \
  -p 4003:5432 \
  -v ./pgdata:/var/lib/postgresql/data \
  docker.io/library/postgres:17

echo "⏳ Waiting for PostgreSQL to be ready..."
until sudo podman exec wpbot-db pg_isready -U wpbot -d wpbot 2>/dev/null; do
  sleep 1
done
# Wait until we can actually execute a query
until sudo podman exec wpbot-db psql -U wpbot -d wpbot -c "SELECT 1" >/dev/null 2>&1; do
  sleep 1
done

echo "🔧 Running setup-db-users.sql..."
sudo podman exec -i wpbot-db psql -U wpbot -d wpbot < packages/api/scripts/setup-db-users.sql

echo "🌱 Running seed..."
bun packages/api/scripts/seed.ts

echo "🔧 Re-running setup-db-users.sql (for orders table permissions)..."
sudo podman exec -i wpbot-db psql -U wpbot -d wpbot < packages/api/scripts/setup-db-users.sql

echo "✅ Database reset complete!"
