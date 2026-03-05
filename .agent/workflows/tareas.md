---
description: Ver tareas pendientes y próximos pasos
---

# Tareas Pendientes

Muestra todas las tareas pendientes del proyecto.

## Pasos

1. **Leer CONTEXT.md** - sección "Próximos Pasos"

2. **Buscar TODOs** en el código:
// turbo
```bash
grep -r "TODO" --include="*.js" --include="*.ts" --include="*.py" --include="*.md" . 2>/dev/null | head -20
```

3. **Mostrar resumen**:
   ```
   📋 TAREAS PENDIENTES
   
   📌 Próximos pasos (CONTEXT.md):
   1. [tarea 1]
   2. [tarea 2]
   
   💻 TODOs en código:
   - archivo.js:45 - TODO: implementar validación
   - utils.py:23 - TODO: refactorizar
   
   📊 Total: X tareas
   ```

4. **Preguntar**: "¿En cuál quieres trabajar?"

## Notas
- Centraliza todas las tareas en un solo lugar
- Ayuda a priorizar el trabajo
