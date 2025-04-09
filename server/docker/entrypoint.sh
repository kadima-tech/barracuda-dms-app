#!/bin/sh

# Ensure we kill the service if any command fails
set -e

# Export PORT if not set (for local development)
if [ -z "$PORT" ]; then
  export PORT=8080
fi

# Make sure the script is executable
chmod +x /app/entrypoint.sh

# Start the application
echo "Starting application on port $PORT"
node dist/index.js
