---
description: Crear un nuevo módulo de negocio para un cliente específico (con protección del código Core)
---

# Nuevo Módulo de Negocio

Crea una extensión de tipo módulo para un cliente específico, respetando las reglas de Core Purity.

## ⚠️ REGLAS INVIOLABLES

- **R1**: PROHIBIDO añadir modelos en `schema.prisma` del core
- **R2**: PROHIBIDO añadir env vars de módulo en `docker-compose.yml` del core
- **R3**: PROHIBIDO añadir imports de módulo en `main.ts` o `app.module.ts`
- **R4**: TODO el código del módulo vive en su propio repo
- **R5**: El ÚNICO punto de contacto es `modules-registry.module.ts`
- **R6**: Controllers usan `@Controller('{nombre}')`

## Pasos

1. **Definir el módulo**:
   - Nombre del módulo
   - Cliente destino
   - Funcionalidad principal
   - ¿Necesita BD propia? ¿API externa?

2. **Crear repo** desde template:

   ```bash
   # Usar template nexo-template-module como base
   git clone https://github.com/llorisg-stra/nexo-template-module nexo-modulo-[nombre]
   ```

3. **Implementar**:
   - `module.ts` — NestJS module
   - `service.ts` — Lógica de negocio
   - `tools.service.ts` — Tools para el agente IA
   - `controller.ts` — API endpoints con `@Controller('[nombre]')`
   - `manifest.json` — Metadata y configFields

4. **Instalar en instancia** del cliente vía nexo-hub

5. **Documentar** en CONTEXT.md de nexo-extensions

## Notas

- NUNCA modificar nexo-core para acomodar un módulo
- El módulo debe ser 100% autocontenido
- Usar configFields para toda configuración dinámica
