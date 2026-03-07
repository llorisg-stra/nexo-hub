#!/bin/bash
set -e
cd ~/nexo-hub
git pull

cd backend
PW=$(grep DATABASE_URL .env | sed 's|.*://admin:||;s|@.*||')
export DATABASE_URL="postgresql://admin:${PW}@localhost:5432/panel_control"

npx prisma db push
npx prisma generate
npm run build
pm2 restart all --silent
echo "ALL_DONE ✅"
