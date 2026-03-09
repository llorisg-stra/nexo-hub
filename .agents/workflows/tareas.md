---
description: Ver tareas pendientes y próximos pasos
---

# Tareas Pendientes

Agrega y prioriza todas las tareas pendientes del proyecto.

## Pasos

1. **Leer CONTEXT.md** — Extraer sección "Próximos Pasos"

2. **Buscar en código** — Encontrar TODOs y FIXMEs:

   ```bash
   grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.html" src/
   ```

3. **Cruzar fuentes** — Combinar tareas de CONTEXT.md con deuda técnica del código

4. **Mostrar vista unificada**:
   - 🔥 Urgente
   - 🔴 Alta prioridad
   - 🟡 Media prioridad
   - 🟢 Baja prioridad
   - 🔧 Deuda técnica (TODOs del código)

5. **Preguntar**: "¿Quieres empezar con alguna de estas tareas?"

## Notas

- Ordenar por prioridad y luego por antigüedad
- Marcar si una tarea tiene dependencias de otras
