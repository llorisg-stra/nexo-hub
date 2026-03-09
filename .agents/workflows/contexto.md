---
description: Gestionar el contexto del proyecto (ver, añadir, actualizar)
---

# Gestión de Contexto

Menú interactivo para gestionar CONTEXT.md del proyecto.

## Pasos

1. **Verificar si existe CONTEXT.md**
   - Si no existe: ofrecer crearlo con plantilla base
   - Si existe: mostrar menú de opciones

2. **Mostrar menú**:
   - 📖 **Ver contexto** — Mostrar resumen formateado
   - ✏️ **Editar sección** — Modificar una sección específica
   - ➕ **Añadir decisión** — Nueva entrada en decisiones técnicas
   - 🔄 **Actualizar estado** — Cambiar fase/estado del proyecto
   - 📋 **Añadir tarea** — Nueva tarea a próximos pasos

3. **Ejecutar acción seleccionada**

4. **Confirmar cambios** con el usuario antes de guardar

## Plantilla Base (si no existe)

```markdown
# 📋 Contexto del Proyecto — [Nombre]

> **Última actualización**: [fecha]
> **Estado**: [estado]

## 🎯 Objetivo del Proyecto
## 🔗 GitHub
## 🖥️ Infraestructura
## 📊 Estado Actual
## 🔧 Decisiones Técnicas
## 🚀 Próximos Pasos
```

## Notas

- CONTEXT.md es la fuente de verdad del proyecto
- Siempre preguntar al usuario antes de hacer cambios
