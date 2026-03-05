---
description: Gestionar el contexto del proyecto (ver, añadir, actualizar)
---

# Gestionar Contexto

Herramienta interactiva para gestionar el archivo CONTEXT.md.

## Pasos

1. **Leer CONTEXT.md** si existe

2. **Mostrar menú de opciones**:
   ```
   📋 Gestión de Contexto
   
   1. 📊 Ver resumen actual
   2. 📝 Añadir nota/decisión
   3. 🔄 Cambiar estado del proyecto
   4. ✅ Marcar tarea como completada
   5. ➕ Añadir próximo paso
   6. 🔧 Añadir decisión técnica
   7. 🔗 Añadir recurso/enlace
   ```

3. **Según la opción elegida**:
   - Pedir la información necesaria
   - Actualizar CONTEXT.md automáticamente
   - Añadir fecha automática en las notas

4. **Confirmar** el cambio realizado

## Formato de notas
Las notas se añaden con este formato:
```markdown
### [FECHA]
- [Contenido de la nota]
```

## Notas
- Si CONTEXT.md no existe, ofrecer crearlo desde la plantilla
- Siempre mostrar confirmación del cambio realizado
