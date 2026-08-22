#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# backup_db.sh
# Xuất bản sao lưu dữ liệu toàn bộ hệ thống ra file SQL nén (.sql.gz)
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ROOT_DIR="$(cd "${DB_DIR}/.." && pwd)"
BACKUP_DIR="${DB_DIR}/backup"

mkdir -p "${BACKUP_DIR}"

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

TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
BACKUP_FILE="${BACKUP_DIR}/backup_${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "====================================================="
echo " [Mini E-Commerce] Backing up Database: ${DB_NAME}"
echo " Destination: ${BACKUP_FILE}"
echo "====================================================="

pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists --no-owner --no-privileges | gzip > "${BACKUP_FILE}"

echo "====================================================="
echo " [SUCCESS] Backup completed: ${BACKUP_FILE}"
echo " Size: $(du -h "${BACKUP_FILE}" | cut -f1)"
echo "====================================================="
