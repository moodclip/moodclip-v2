#!/bin/sh
# Abort on any error
set -e

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting application..."
exec npm run start
