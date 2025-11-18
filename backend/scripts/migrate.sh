#!/bin/bash
set -e  # Exit on any error

echo "🔄 Running database migrations..."

# Run migrations
npm run migrate

# If SEED_TEST_DATA is set to "true", run test data seeding
if [ "$SEED_TEST_DATA" = "true" ]; then
  echo "🌱 Seeding test data..."
  npm run seed -- --test
else
  echo "⏭️  Skipping test data seeding (SEED_TEST_DATA is not 'true')"
fi

echo "✅ Migration and seeding completed successfully"

