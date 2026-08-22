#!/usr/bin/env bash
set -e

# =============================================================================
# 01-init-database.sh
# PostgreSQL Docker entrypoint init script for Mini E-Commerce Platform
# Initializes ecommerce_db, creates schema (V1), and seeds initial data (V2)
# =============================================================================

TARGET_DB="${POSTGRES_DB:-ecommerce_db}"
TARGET_USER="${POSTGRES_USER:-ecommerce}"

echo "[DB-INIT] Checking target database '$TARGET_DB'..."

# Create database if it does not exist
psql -v ON_ERROR_STOP=1 --username "$TARGET_USER" --dbname "postgres" <<-EOSQL
    SELECT 'CREATE DATABASE $TARGET_DB'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$TARGET_DB')\gexec
EOSQL

echo "[DB-INIT] Applying V1 Schema Migration to '$TARGET_DB'..."
psql -v ON_ERROR_STOP=1 --username "$TARGET_USER" --dbname "$TARGET_DB" -f /database/migrations/V1__init_schema.sql

echo "[DB-INIT] Applying V2 Seed Migration to '$TARGET_DB'..."
psql -v ON_ERROR_STOP=1 --username "$TARGET_USER" --dbname "$TARGET_DB" -f /database/migrations/V2__seed_data.sql

echo "[DB-INIT] Database initialization completed successfully!"
