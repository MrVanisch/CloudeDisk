#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Wait for the external database to be ready
# The script will use POSTGRES_SERVER from the .env file
echo "Waiting for database at $POSTGRES_SERVER to be ready..."
while ! nc -z $POSTGRES_SERVER 5432; do
  sleep 1
done
echo "Database is ready."

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Start the FastAPI application
echo "Starting application..."
exec uvicorn main:app --host 0.0.0.0 --port 8000