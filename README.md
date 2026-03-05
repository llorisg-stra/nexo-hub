# Nexo Hub

Panel de control y administración. Una sola instancia que gestiona todas las matrices de clientes.

## Estructura

```
nexo-hub/
├── backend/          ← NestJS (provisioning, clients, packages, pricing)
├── frontend/         ← Angular 19 (UI admin)
├── scripts/          ← Scripts de deploy
└── .env.example
```

## Setup

```bash
# 1. Backend
cd backend
cp ../.env.example .env
# Rellenar valores en .env
npm install
npx prisma generate
npx prisma db push
npm run start:dev

# 2. Frontend
cd frontend
npm install
ng serve
```

## Deploy

Push a main → CI/CD auto-deploy via GitHub Actions.
