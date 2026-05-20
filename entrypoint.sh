#!/bin/sh

echo "Running database schema sync..."
npx prisma db push

echo "Running database seeding (if empty)..."
npx tsx prisma/seed.ts

echo "Starting Next.js application..."
exec npm run start
