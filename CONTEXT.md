# 📋 Contexto del Proyecto — Nexo Hub

> **Última actualización**: 2026-03-06
> **Estado**: ✅ Desplegado en VPS. Monorepo legacy eliminado.

---

## 🎯 Objetivo del Proyecto

Panel de administración central para gestionar todas las matrices (instancias de Nexo Core) desplegadas para clientes. Provisioning, gestión de extensiones, clientes, VPS, y billing.

---

## 🔗 GitHub

| Campo | Valor |
|-------|-------|
| Usuario | llorisg-stra |
| Repositorio | nexo-hub |
| URL | <https://github.com/llorisg-stra/nexo-hub> |
| Rama principal | main |
| Visibilidad | Privado |

---

## 🖥️ Infraestructura

| Campo | Valor |
|-------|-------|
| VPS Principal | `51.255.199.114` |
| URL Panel | `https://panel.strategialaboratory.com` |
| Backend | NestJS (PM2, puerto 3100) |
| Frontend | Angular 19 (Nginx estático) |
| BD | PostgreSQL (misma instancia que la Matriz principal) |

---

## 📊 Estado Actual

### Módulos del Backend (NestJS)

| Módulo | Propósito |
|--------|-----------|
| `provisioning/` | Pipeline 5 pasos (deploy-nexo-core.sh vía SSH + health + admin + plugins + packages) |
| `clients/` | CRUD clientes |
| `vps-nodes/` | Gestión nodos VPS |
| `packages/` | Catálogo extensiones (visibilidad PUBLIC/PRIVATE, SSH install) |
| `pricing/` | Tiers y precios |
| `workers/` | Heartbeat workers |
| `ssh/` | SshService |
| `audit/` | Logs de auditoría |
| `ovh/` | Wrapper API OVH (VPS list, status, reinstall, reboot) |
| `auth/` | ApiKeyGuard |
| `prisma/` | PrismaService |

### Frontend (Angular 19)

Páginas: `login`, `dashboard`, `clients`, `matrices`, `matrix-detail`, `vps`, `provision`, `extensiones`, `planes`, `audit`, `workers`

---

## 🔧 Decisiones Técnicas

| Decisión | Valor |
|----------|-------|
| Separado de | `Plantilla-Agente` (monorepo legacy) |
| Repo Core | `nexo-core` (lo que se clona por cliente) |
| Auth | `ApiKeyGuard` (via `X-API-Key` header) |
| BD | Compartida con la Matriz principal por ahora |
| Deploy | PM2 (backend) + Nginx estático (frontend) |

### 2026-03-06 — Refactoring ProvisioningService + Angular screens

> 🔥 **DECISIÓN CRÍTICA**: Los scripts bash (`setup-vps.sh`, `deploy-nexo-core.sh`,
> `provision-vps.sh`) son la **FUENTE DE VERDAD** para el provisioning.
> El `ProvisioningService` de NestJS debe **llamar a estos scripts vía SSH**,
> NO reimplementar la lógica en TypeScript.

- ✅ Scripts de provisioning: `setup-vps.sh`, `deploy-nexo-core.sh`, `provision-vps.sh`
- ✅ WireGuard VPN automatizado + dedicado blindado
- ✅ SSH Auto-Lock (30 min inactividad) en dedicado
- ✅ Container names + puertos dinámicos en `nexo-core/docker-compose.yml`
- ✅ `OvhService` — API wrapper NestJS (`/api/ovh/*`)
- ✅ Deploy test end-to-end exitoso
- ✅ DNS verification loop para SSL fiable
- ✅ **Refactoring ProvisioningService**: eliminado step stale `SELECT_VPS`, tests actualizados (10/10)
- ✅ **Angular screens**: provision stepLabels sincronizados, suspend/reactivate en matrices list, branding Nexo Hub

### 2026-03-05 — Separación de repos

- ✅ Código extraído de `Plantilla-Agente/panel-backend` → `nexo-hub/backend`
- ✅ Código extraído de `Plantilla-Agente/panel-frontend` → `nexo-hub/frontend`
- ✅ `provisioning.service.ts` actualizado: clona desde `nexo-core.git`
- ✅ `.env.example` actualizado con nueva URL
- ✅ Build verificado: `npm install` + `prisma generate` + `nest build` ✅
- ✅ Tests: 35/42 passed (7 flaky pre-existentes)
- ✅ Push a GitHub
- ✅ Deploy en VPS: PM2 + Nginx migrados a `~/nexo-hub`
- ✅ CI/CD configurado con GitHub Actions (password auth)
- ✅ BD Panel limpiada — empezamos de cero
- ✅ Workflows, CONTEXT.md, TAREAS.md creados

### 2026-03-05 — Limpieza VPS

- ✅ SSH configurado con clave ed25519 (alias: `nexo-vps`)
- ✅ Docker containers `matriz-*` parados y eliminados (6 contenedores)
- ✅ `~/Matriz-Agente` eliminado del VPS
- ✅ `docker system prune -af` — **48.47GB recuperados**
- ✅ Disco: 82% → **12%** (8.6G/72G)
- ✅ Solo queda `~/nexo-hub` en el VPS
- ✅ Repo `Matriz-Agente` archivado en GitHub

---

## 🚀 Próximos Pasos

1. ~~🔴 **Refactorizar `ProvisioningService`**~~ ✅ Hecho
2. ~~🔴 **Pantallas Angular**~~ ✅ Hecho (VPS ya estaba, provision/matrices actualizados)
3. 🔴 **Probar suspend/reactivate/update/delete** — E2E en VPS real
4. 🔴 **Verificar `panel.strategialaboratory.com`** — Deploy actualización
5. 🟡 **Billing/Stripe**: Cobros automáticos por plan
6. 🟡 **Dashboard métricas reales**: Transicionar del Demo Mode
