---
description: Documentar una nueva API externa
---

# Documentar API

Genera o actualiza documentación de una API externa o interna.

## Pasos

1. **Identificar la API**:
   - ¿Qué API se quiere documentar?
   - ¿Es interna (NestJS) o externa (terceros)?

2. **Para API interna**: Escanear controllers NestJS:
   - Listar endpoints (método, ruta, parámetros)
   - Documentar request/response bodies
   - Anotar autenticación requerida

3. **Para API externa**: Recopilar información:
   - Base URL
   - Autenticación (API Key, OAuth, JWT)
   - Endpoints principales
   - Rate limits
   - Ejemplos de request/response

4. **Generar documentación** en formato tabla markdown

5. **Guardar** en la ubicación apropiada del proyecto

## Notas

- Seguir formato consistente con tablas
- Incluir ejemplos con curl cuando sea posible
- Si la API tiene SDK, documentar su uso
