#!/bin/sh

echo "Running database schema sync..."
npx prisma db push --skip-generate

echo "Running database seeding (if empty)..."
npx prisma db seed

echo "Starting Next.js application..."
exec npm run start
