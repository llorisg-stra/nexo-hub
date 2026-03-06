# 📋 TAREAS PENDIENTES — Nexo Hub

> Última actualización: 2026-03-06

---

## 🔴 Prioridad ALTA

### ✅ COMPLETADO — Refactorizar ProvisioningService

> Scripts bash son la fuente de verdad. ProvisioningService los ejecuta vía SSH.

- [x] Eliminado step stale `SELECT_VPS` del pipeline
- [x] `stepRunDeployScript` delega a `deploy-nexo-core.sh`
- [x] `stepPrepareVps` delega a `setup-vps.sh`
- [x] Tests actualizados (10/10) + mock `PackagesService` + 4 tests bash delegation
- [x] Angular: `stepLabels` sincronizados, suspend/reactivate en matrices list, branding Nexo Hub

### Deploy en VPS

- [x] ~~Clonar `nexo-hub` en VPS principal~~
- [x] ~~Configurar `.env`~~
- [x] ~~PM2 + Nginx~~
- [ ] Verificar `panel.strategialaboratory.com` post-actualización

### Provisioning E2E

- [x] ~~Deploy test exitoso con `deploy-nexo-core.sh`~~
- [x] ~~Verificar que clona `nexo-core`~~
- [x] ~~Verificar DNS, SSL, health check~~
- [ ] Probar suspend/reactivate/update/delete

---

## 🟡 Prioridad MEDIA

### Billing / Stripe

- [ ] Integrar Stripe para cobros automáticos por plan
- [ ] Webhook de Stripe para actualizar estado del cliente

### Dashboard métricas reales

- [ ] Transicionar del Demo Mode a datos de producción
- [ ] Widgets con datos de matrices activas

---

## 🟢 Prioridad BAJA

### Limpieza

- [ ] Eliminar workflows no relevantes (nuevo-modulo, continuar-modulo)
- [ ] Archivar `Plantilla-Agente` en GitHub

---

## ✅ Completado (2026-03-05/06)

- [x] Scripts: `setup-vps.sh`, `deploy-nexo-core.sh`, `provision-vps.sh`
- [x] WireGuard VPN automatizado
- [x] Dedicado blindado (SSH solo VPN)
- [x] SSH Auto-Lock (30 min inactividad)
- [x] Container names + puertos dinámicos (`docker-compose.yml`)
- [x] `OvhService` — API wrapper NestJS
- [x] `.env` con OVH, Cloudflare, GitHub PAT
- [x] Deploy test end-to-end exitoso
- [x] DNS verification loop para SSL fiable
- [x] Refactoring `ProvisioningService` — pipeline limpio, tests 10/10
- [x] Angular screens — provision stepLabels, suspend/reactivate, branding Nexo Hub
