#!/bin/bash

# Run database migrations/push on startup (when DB is available)
echo "🔄 Pushing database schema changes..."
npx prisma db push --accept-data-loss

# Start the application
echo "🚀 Starting server..."
npm start
