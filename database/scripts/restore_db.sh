#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# restore_db.sh
# Phục hồi dữ liệu hệ thống từ file sao lưu (.sql hoặc .sql.gz)
# Cách dùng: ./restore_db.sh path/to/backup.sql.gz
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ROOT_DIR="$(cd "${DB_DIR}/.." && pwd)"
BACKUP_DIR="${DB_DIR}/backup"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup-file.sql | backup-file.sql.gz>"
  echo "Available backups in ${BACKUP_DIR}:"
  ls -l "${BACKUP_DIR}"/*.sql.gz 2>/dev/null || echo "  (No backups found)"
  exit 1
fi

BACKUP_FILE="$1"

if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "Error: Backup file '${BACKUP_FILE}' not found."
  exit 1
fi

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
echo " [Mini E-Commerce] Restoring Database: ${DB_NAME}"
echo " Source: ${BACKUP_FILE}"
echo "====================================================="

# Ensure database exists
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "postgres" -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || \
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "postgres" -c "CREATE DATABASE ${DB_NAME};"

if [[ "${BACKUP_FILE}" == *.gz ]]; then
  gunzip -c "${BACKUP_FILE}" | psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}"
else
  psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "${BACKUP_FILE}"
fi

echo "====================================================="
echo " [SUCCESS] Restore completed successfully!"
echo "====================================================="
