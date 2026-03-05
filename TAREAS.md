# 📋 TAREAS PENDIENTES — Nexo Hub

> Última actualización: 2026-03-05

---

## 🔴 Prioridad ALTA

### Deploy en VPS

- [ ] Clonar `nexo-hub` en VPS principal (`~/nexo-hub`)
- [ ] Configurar `.env` con `MATRIZ_REPO_URL=...nexo-core.git`
- [ ] PM2 apunta a `~/nexo-hub/backend`
- [ ] Nginx sirve frontend desde `~/nexo-hub/frontend`
- [ ] Verificar `panel.strategialaboratory.com`

### Provisioning E2E

- [ ] Provisionar una matriz nueva desde el Panel
- [ ] Verificar que clona `nexo-core` (no `Matriz-Agente`)
- [ ] Verificar DNS, SSL, health check
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
