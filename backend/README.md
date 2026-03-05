# 🏢 Panel de Control — Backend

Backend del Panel de Control de Estrategia Labs para gestionar matrices de clientes.

## Stack

- **NestJS** + TypeScript
- **Prisma** (PostgreSQL)
- **node-ssh** (ejecución remota en VPS)
- **Stripe** (webhooks de pago)

## Módulos

| Módulo | Descripción |
|--------|-------------|
| `ClientsModule` | CRUD de clientes con datos de facturación |
| `VpsNodesModule` | Gestión de nodos VPS (SSH, stats, capacidad) |
| `ProvisioningModule` | Pipeline de 10 pasos para crear matrices |
| `SshModule` | Abstracción SSH para ejecutar comandos remotos |
| `PrismaModule` | Acceso a base de datos |

## Endpoints

### Clientes

- `POST /api/clients` — Crear cliente
- `GET /api/clients` — Listar clientes
- `GET /api/clients/:id` — Detalle cliente
- `PATCH /api/clients/:id` — Actualizar cliente
- `DELETE /api/clients/:id` — Eliminar (soft-delete)

### VPS Nodes

- `POST /api/vps-nodes` — Registrar VPS
- `GET /api/vps-nodes` — Listar VPS
- `POST /api/vps-nodes/:id/test-connection` — Test SSH
- `GET /api/vps-nodes/:id/stats` — Stats del servidor

### Matrices

- `POST /api/matrices` — Crear y provisionar matriz
- `GET /api/matrices` — Listar matrices
- `GET /api/matrices/:id` — Detalle con eventos
- `GET /api/matrices/:id/events` — Progreso provisioning
- `POST /api/matrices/:id/suspend` — Suspender
- `POST /api/matrices/:id/reactivate` — Reactivar
- `POST /api/matrices/:id/update` — Actualizar a última versión
- `POST /api/matrices/:id/delete` — Eliminar
- `POST /api/matrices/actions/update-all` — Rolling update

### Webhooks

- `POST /api/webhooks/stripe` — Stripe webhook

## Setup

```bash
npm install
cp .env.example .env  # Configurar variables
npx prisma generate
npx prisma db push
npm run start:dev
```

Servidor arranca en `http://localhost:3100`
