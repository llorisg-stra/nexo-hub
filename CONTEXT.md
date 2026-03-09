# 📋 Contexto del Proyecto — Nexo Hub

> **Última actualización**: 2026-03-09
> **Estado**: ✅ Desplegado en VPS. 4 repos: nexo-hub, nexo-core, nexo-extensions, nexo-worker.

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
| BD | PostgreSQL (standalone en VPS Hub) |

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
| `ovh/` | Wrapper API OVH (VPS list, status, reinstall, reboot, SSH keys, ignored VPS) |
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

### 2026-03-09 — OneDrive sync fix, workflows propagation

- ✅ **Fix sync OneDrive**: `.agent` → `_agent` en nexo-hub (OneDrive no sincroniza carpetas con `.`)
- ✅ **Workflows copiados**: `_agent/workflows/` (28 workflows) clonados a nexo-core y nexo-worker
- ✅ **nexo-extensions**: `.agents` → `_agents` en raíz + `_agent/workflows/` clonado en 15 extensiones, 5 nexo-template-*, 5 templates/*

### 2026-03-07 — OVH Discovery, SSH key automation, worker extraction

- ✅ **OVH VPS Discovery**: sección en Nodos VPS que muestra VPS de la cuenta OVH
- ✅ **Importar nodos OVH**: botón importar que pre-rellena formulario con IPv4 auto
- ✅ **Red Flags persistentes**: ignorar VPS guardado en BD (tabla `ignored_ovh_vps`)
- ✅ **SSH Key auto-registration**: registra `id_ed25519.pub` en OVH al arrancar (idempotente)
- ✅ **Reinstall con SSH key**: provisioning sin passwords
- ✅ **Login rebranding**: "Nexo Hub" + "Control Panel"
- ✅ **CI/CD fix**: SSH key auth en GitHub Actions
- ✅ **PostgreSQL restaurado**: BD caída tras limpieza Docker, reinstalada fresh
- ✅ **nexo-worker repo**: extraído de Plantilla-Agente/servidor dedicado → GitHub
- ✅ **Worker registrado**: worker-01 (147.135.215.195) visible en panel

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

## 🧭 Decisiones Estratégicas (2026-03-07 — Análisis Manus.im)

> Decisiones del análisis competitivo que afectan a `nexo-hub`.

| Decisión | Impacto en Hub |
|----------|---------------|
| **Dashboard de consumo** | Nuevo módulo: métricas de uso, tokens consumidos, costes por instancia |
| **Skills Marketplace real** | Evolucionar marketplace a plataforma abierta para terceros |
| **Worker = manos** | El panel debe gestionar múltiples workers (no solo OCR). Heartbeats generalizados |
| **Adoptar MCP** | Catálogo de paquetes debe soportar conectores MCP además de los propios |

---

## 🚀 Próximos Pasos

### 🔥 Urgente

1. **Worker heartbeats** — worker-01 reporte estado al panel (Live Status)
2. **Test E2E provisioning** — crear una matriz real desde el panel
3. **Dashboard métricas reales** — transicionar del Demo Mode

### 🔴 Alta prioridad

1. **Dashboard de consumo** — métricas uso, tokens, costes por instancia
2. **Billing/Stripe** — cobros automáticos por plan

### 🟡 Media prioridad

1. **Skills Marketplace** — abrir a terceros con revisión + sandbox
2. **Compra automática VPS** — desde panel via OVH API
3. **Logs provisioning en vivo** — ver setup-vps.sh en tiempo real
4. **Multi-usuario** — roles admin/viewer
