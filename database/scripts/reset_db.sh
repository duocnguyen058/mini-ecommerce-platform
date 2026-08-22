#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# reset_db.sh
# Xóa sạch toàn bộ dữ liệu và cấu trúc, sau đó khởi tạo lại từ đầu
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
echo " [WARNING] Resetting Database: ${DB_NAME}"
echo " Host: ${DB_HOST}:${DB_PORT} | User: ${DB_USER}"
echo "====================================================="

# Terminate active connections and drop database
echo "1. Terminating active connections and dropping database '${DB_NAME}'..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "postgres" -c "
  SELECT pg_terminate_backend(pg_stat_activity.pid)
  FROM pg_stat_activity
  WHERE pg_stat_activity.datname = '${DB_NAME}'
    AND pid <> pg_backend_pid();
" > /dev/null 2>&1 || true

psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "postgres" -c "DROP DATABASE IF EXISTS ${DB_NAME};"

# Re-run init_db.sh
echo "2. Re-initializing database..."
bash "${SCRIPT_DIR}/init_db.sh"

echo "====================================================="
echo " [SUCCESS] Database '${DB_NAME}' reset completed successfully!"
echo "====================================================="
