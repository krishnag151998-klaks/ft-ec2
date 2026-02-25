#!/bin/bash
set -e

# Ensure locally installed binaries are on PATH
export PATH="./node_modules/.bin:$PATH"

echo "🌳 Family Tree — Starting up..."

# Run Prisma migrations
echo "📦 Running database migrations..."
prisma migrate deploy

# Seed database if it's the first run
echo "🌱 Seeding database (skips if data exists)..."
prisma db seed || true

echo "🚀 Starting application..."
exec "$@"
