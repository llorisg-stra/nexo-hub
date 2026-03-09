---
description: Ayuda a diagnosticar y resolver errores
---

# Debug

Diagnóstico inteligente de errores basado en logs, trazas y código.

## Pasos

1. **Recopilar información del error**:
   - ¿Qué error ves? (mensaje, screenshot, log)
   - ¿Cuándo ocurre? (acción que lo provoca)
   - ¿Es reproducible?

2. **Revisar logs**:

   ```bash
   # Docker logs
   docker logs [container-name] --tail 100
   # Logs del backend
   docker logs ${CLIENT_NAME}-backend --tail 200
   ```

3. **Analizar el código relacionado**:
   - Buscar el archivo/función donde ocurre el error
   - Revisar cambios recientes en esa zona
   - Verificar dependencias y imports

4. **Proponer solución**:
   - Explicar la causa raíz
   - Mostrar el fix propuesto
   - Confirmar con el usuario antes de aplicar

5. **Verificar** que el fix resuelve el problema

## Notas

- Siempre pedir el error exacto antes de asumir
- Revisar si el error ya se documentó en CONTEXT.md
- Si es un error de infraestructura, verificar Docker y puertos
