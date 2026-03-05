# 📋 Contexto del Proyecto — Nexo Hub

> **Última actualización**: 2026-03-05
> **Estado**: ✅ Recién separado del monorepo `Plantilla-Agente`. Pendiente deploy en VPS.

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
| `provisioning/` | Pipeline 12+ pasos (clone, env, compose, docker, DNS, SSL, etc.) |
| `clients/` | CRUD clientes |
| `vps-nodes/` | Gestión nodos VPS |
| `packages/` | Catálogo extensiones (visibilidad PUBLIC/PRIVATE, SSH install) |
| `pricing/` | Tiers y precios |
| `workers/` | Heartbeat workers |
| `ssh/` | SshService |
| `audit/` | Logs de auditoría |
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

---

## 🚀 Próximos Pasos

1. 🔴 **Extraer extensiones**: Separar canales y plugins de `nexo-core` a repos independientes
2. 🔴 **Provisionar primera matriz** de prueba con `nexo-core`
3. 🟡 **Billing/Stripe**: Cobros automáticos por plan
4. 🟡 **Dashboard métricas reales**: Transicionar del Demo Mode
5. 🟢 **Borrar `~/Matriz-Agente`** del VPS y archivar repo en GitHub
