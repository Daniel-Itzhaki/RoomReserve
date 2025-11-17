#!/bin/bash
set -e
echo "Running Prisma migrations..."
npx prisma generate
npx prisma db push --accept-data-loss
echo "Database schema synced successfully!"
