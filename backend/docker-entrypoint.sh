#!/bin/sh
set -e

echo "[entrypoint] Applying database migrations (prisma migrate deploy)..."
npx prisma migrate deploy

# Optional one-time seed: set SEED_ON_START=true to populate demo data.
if [ "$SEED_ON_START" = "true" ]; then
  echo "[entrypoint] Seeding demo data..."
  node prisma/seed.js || echo "[entrypoint] Seed skipped/failed (continuing)."
fi

echo "[entrypoint] Starting API server..."
exec node src/server.js
