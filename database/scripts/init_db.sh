#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# init_db.sh
# Khởi tạo database, tạo schema và nạp dữ liệu seed
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ROOT_DIR="$(cd "${DB_DIR}/.." && pwd)"

# Load .env if present
if [[ -f "${ROOT_DIR}/.env" ]]; then
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env"
fi

DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5433}"
DB_USER="${POSTGRES_USER:-ecommerce}"
DB_NAME="${POSTGRES_DB:-ecommerce_db}"
export PGPASSWORD="${POSTGRES_PASSWORD:-ecommerce_local}"

echo "====================================================="
echo " [Mini E-Commerce] Initializing Database: ${DB_NAME}"
echo " Host: ${DB_HOST}:${DB_PORT} | User: ${DB_USER}"
echo "====================================================="

# Check connection to postgres server
echo "1. Checking database connection..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "postgres" -c "SELECT 1;" > /dev/null 2>&1 || {
  echo "Error: Cannot connect to PostgreSQL server at ${DB_HOST}:${DB_PORT} with user ${DB_USER}."
  echo "Make sure PostgreSQL container is running: docker compose up -d postgres"
  exit 1
}

# Create database if not exists
echo "2. Ensuring database '${DB_NAME}' exists..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "postgres" -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || \
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "postgres" -c "CREATE DATABASE ${DB_NAME};"

# Apply Schema (V1)
echo "3. Applying Schema (V1__init_schema.sql)..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "${DB_DIR}/migrations/V1__init_schema.sql"

# Apply Seed Data (V2)
echo "4. Applying Seed Data (V2__seed_data.sql)..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "${DB_DIR}/migrations/V2__seed_data.sql"

echo "====================================================="
echo " [SUCCESS] Database '${DB_NAME}' initialized successfully!"
echo "====================================================="
