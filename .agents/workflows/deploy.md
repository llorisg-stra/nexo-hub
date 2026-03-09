---
description: Guía paso a paso para desplegar el proyecto
---

# Deploy

Guía para desplegar cambios en el VPS de desarrollo o producción.

## Pasos

1. **Verificar qué se va a desplegar**:
   - ¿Qué cambios se han hecho?
   - ¿Backend, frontend, o ambos?
   - ¿VPS dev o producción?

2. **Sincronizar código** en el VPS:

   ```bash
   ssh root@[IP_VPS]
   cd /root/nexo-core
   git pull origin main
   ```

3. **Rebuild contenedores** afectados:

   ```bash
   # Solo backend
   docker compose up -d --build ${CLIENT_NAME}-backend
   # Solo frontend
   docker compose up -d --build ${CLIENT_NAME}-frontend
   # Ambos
   docker compose up -d --build
   ```

4. **Ejecutar migraciones** si hay cambios en schema:

   ```bash
   docker exec ${CLIENT_NAME}-backend npx prisma migrate deploy
   ```

5. **Verificar** el deploy:
   - Backend: `curl https://dev.strategialaboratory.com/health`
   - Frontend: Abrir `https://app-dev.strategialaboratory.com`
   - Logs: `docker logs ${CLIENT_NAME}-backend --tail 50`

## Notas

- Siempre verificar `git status` antes de deploy
- En producción, hacer backup primero (/backup)
- Los puertos se asignan dinámicamente por `deploy-nexo-core.sh`
