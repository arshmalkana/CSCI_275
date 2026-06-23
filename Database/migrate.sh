#!/usr/bin/env bash
# migrate.sh — apply any unapplied migrations from Database/migrations/
# Usage (from project root):
#   bash Database/migrate.sh
#   DB_CONTAINER=ahpunjab-postgres bash Database/migrate.sh
#
# Each *.sql file in Database/migrations/ is named NNN-description.sql.
# Applied versions are tracked in the schema_migrations table.
# This script is idempotent: re-running it skips already-applied migrations.

set -euo pipefail

CONTAINER="${DB_CONTAINER:-ahpunjab-postgres}"
DB_USER="${DB_USER:-ahpunjab}"
DB_NAME="${DB_NAME:-ahpunjab_db}"
MIGRATIONS_DIR="$(cd "$(dirname "$0")/migrations" && pwd)"

psql_exec() {
  docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" "$@"
}

# Ensure tracking table exists
psql_exec -c "
CREATE TABLE IF NOT EXISTS schema_migrations (
  version    TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);" > /dev/null

echo "Checking for unapplied migrations..."

applied=0
for file in "$MIGRATIONS_DIR"/*.sql; do
  filename="$(basename "$file" .sql)"
  # Check if already applied
  count=$(psql_exec -t -c "SELECT COUNT(*) FROM schema_migrations WHERE version = '$filename';" | tr -d ' ')
  if [ "$count" -eq 0 ]; then
    echo "  Applying: $filename"
    psql_exec < "$file"
    psql_exec -c "INSERT INTO schema_migrations (version) VALUES ('$filename') ON CONFLICT DO NOTHING;" > /dev/null
    echo "  Applied:  $filename"
    applied=$((applied + 1))
  fi
done

if [ "$applied" -eq 0 ]; then
  echo "All migrations already applied."
else
  echo "Applied $applied migration(s)."
fi
