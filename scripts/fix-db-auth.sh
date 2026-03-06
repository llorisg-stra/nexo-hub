#!/bin/bash
set -e
# Extract the password from DATABASE_URL in .env
PW=$(grep DATABASE_URL ~/nexo-hub/backend/.env | sed 's|.*://admin:||;s|@.*||')
echo "Setting PostgreSQL password for admin (${#PW} chars)..."
echo "ALTER USER admin WITH PASSWORD '$PW';" | sudo -u postgres psql
echo "Password synced ✅"

# Restart PM2
pm2 restart all --silent
echo "PM2 restarted ✅"
