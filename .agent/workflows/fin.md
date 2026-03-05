---
description: Fin de sesión - guardar progreso y sincronizar
---

# Fin de Sesión

Guarda el progreso del día y sincroniza con GitHub.

## Pasos

1. **Preguntar resumen del trabajo**:
   - "¿Qué has hecho en esta sesión?"
   - El usuario describe brevemente

2. **Actualizar CONTEXT.md**:
   - Añadir nota con fecha de hoy
   - Actualizar próximos pasos si es necesario
   - Marcar tareas completadas

3. **Sincronizar con Git**:
// turbo
```bash
git add .
```

4. **Crear commit con resumen**:
```bash
git commit -m "sesión: [resumen del trabajo]"
```

// turbo
5. **Push a GitHub**:
```bash
git push
```

6. **Confirmar**: "✅ Sesión guardada y sincronizada"

## Notas
- Usar este workflow al terminar de trabajar
- Garantiza que el progreso está documentado y subido
