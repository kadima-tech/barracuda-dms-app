#!/bin/sh

# Ensure we kill the service if migration fails
set -e

# Export PORT if not set (for local development)
if [ -z "$PORT" ]; then
  export PORT=8085
fi

# Start the application
yarn start
