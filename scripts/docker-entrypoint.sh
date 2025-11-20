#!/bin/bash

# BookaMOT SaaS - Docker Entrypoint Script
# This script handles database migrations and Prisma Client generation
# before starting the Next.js application

set -e

echo "🚀 Starting BookaMOT SaaS application..."
echo "📍 Environment: ${NODE_ENV:-production}"

# Function to wait for database
wait_for_db() {
  echo "⏳ Waiting for PostgreSQL to be ready..."
  
  local max_attempts=30
  local attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    if pg_isready -h ${DB_HOST:-postgres} -U ${DB_USER} -d ${DB_NAME} 2>/dev/null; then
      echo "✅ PostgreSQL is ready!"
      return 0
    fi
    
    echo "   Attempt $attempt/$max_attempts: PostgreSQL not ready yet..."
    sleep 2
    attempt=$((attempt + 1))
  done
  
  echo "❌ PostgreSQL failed to start after $max_attempts attempts"
  return 1
}

# Function to run database migrations
run_migrations() {
  echo ""
  echo "🔄 Running database migrations..."
  
  if [ -d "prisma/migrations" ] || [ -d "resources/prisma/migrations" ]; then
    if npx prisma migrate deploy --skip-generate; then
      echo "✅ Database migrations completed successfully!"
      return 0
    else
      echo "⚠️  Migration warning (may be expected if no new migrations)"
      return 0
    fi
  else
    echo "ℹ️  No migrations directory found, skipping migrations"
    return 0
  fi
}

# Function to generate Prisma Client
generate_prisma_client() {
  echo ""
  echo "🔧 Generating Prisma Client..."
  
  if npx prisma generate; then
    echo "✅ Prisma Client generated successfully!"
    return 0
  else
    echo "❌ Failed to generate Prisma Client"
    return 1
  fi
}

# Main execution
main() {
  # Wait for database to be ready
  if ! wait_for_db; then
    echo "❌ Failed to connect to database"
    exit 1
  fi
  
  # Generate Prisma Client (should already be done in build, but ensure it's available)
  if ! generate_prisma_client; then
    echo "❌ Failed to generate Prisma Client"
    exit 1
  fi
  
  # Run database migrations
  if ! run_migrations; then
    echo "❌ Failed to run database migrations"
    exit 1
  fi
  
  echo ""
  echo "✨ All startup tasks completed successfully!"
  echo "🎯 Starting Next.js application..."
  echo ""
  
  # Start the application
  exec node server.js
}

# Run main function
main "$@"

