#!/bin/sh

# Ensure we kill the service if migration fails
set -e

# Wait for any services if needed
# Example: wait-for-it.sh database:5432 -t 60

# Start the application
node dist/index.js
