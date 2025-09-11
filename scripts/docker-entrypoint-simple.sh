#!/bin/sh

# Simple Docker entrypoint without migrations
echo "Starting CroweCode Platform..."

# Just start the server directly
echo "Starting Next.js server on port 3000..."
exec node server.js