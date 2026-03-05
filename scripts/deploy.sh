#!/bin/bash
set -eo pipefail

# Nexo Hub — Deploy Script
# Usage: bash scripts/deploy.sh [deploy_dir]

DEPLOY_DIR="${1:-$(pwd)}"
cd "$DEPLOY_DIR"

echo "📥 Pulling latest code..."
git fetch origin main
git reset --hard origin/main

# ---- Panel Backend (NestJS via PM2) ----
echo "🎛️  Building Panel Backend..."
cd "$DEPLOY_DIR/backend"
npm install 2>&1 | tail -3
./node_modules/.bin/nest build
if command -v pm2 &> /dev/null; then
  pm2 restart all --silent
  echo "✅ Panel Backend rebuilt + PM2 restarted"
fi

# ---- Panel Frontend (Angular → Nginx static) ----
echo "🎨 Building Panel Frontend..."
cd "$DEPLOY_DIR/frontend"
npm install 2>&1 | tail -3
./node_modules/.bin/ng build --configuration production
echo "✅ Panel Frontend rebuilt"

# ---- Reload Nginx ----
if command -v nginx &> /dev/null; then
  echo "🔄 Reloading Nginx..."
  sudo nginx -t && sudo systemctl reload nginx && echo "✅ Nginx reloaded" || echo "⚠️  Nginx reload failed"
fi

echo ""
echo "🎉 Nexo Hub deploy complete at $DEPLOY_DIR"
