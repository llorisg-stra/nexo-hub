---
description: Guía paso a paso para arrancar un proyecto nuevo desde la plantilla
---

# Nuevo Proyecto

Crea un nuevo proyecto/instancia desde la plantilla nexo-core.

## Pasos

1. **Definir parámetros**:
   - Nombre del cliente / proyecto
   - Slug para subdominio (`[slug].strategialaboratory.com`)
   - VPS destino (IP)
   - Requisitos especiales (extensiones, módulos)

2. **Provisionar vía nexo-hub** (automático):
   - El hub ejecuta `setup-vps.sh` y `deploy-nexo-core.sh`
   - Se asignan puertos dinámicamente
   - Se configura Traefik + SSL

3. **O provisionar manualmente**:

   ```bash
   ssh root@[IP_VPS]
   git clone https://github.com/llorisg-stra/nexo-core /root/nexo-core
   cd /root/nexo-core
   cp .env.example .env
   # Editar .env con CLIENT_NAME, puertos, API keys
   docker compose up -d --build
   ```

4. **Configurar instancia**:
   - Crear usuario admin
   - Configurar tenant
   - Instalar extensiones necesarias

5. **Verificar**:
   - Backend health check
   - Frontend accesible
   - n8n funcionando

6. **Registrar** en CONTEXT.md del hub

## Notas

- Usar deploy-nexo-core.sh siempre que sea posible (source of truth)
- Los puertos se auto-asignan en slots de 10
- Cada instancia tiene containers con prefijo CLIENT_NAME
