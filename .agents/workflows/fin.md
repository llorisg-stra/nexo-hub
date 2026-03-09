---
description: Fin de sesión - guardar progreso y sincronizar
---

# Fin de Sesión

Guarda el progreso, actualiza CONTEXT.md y sincroniza con GitHub.

## Pasos

1. **Recopilar logros de la sesión**:
   - Revisar qué tareas se completaron
   - Identificar cambios realizados en código

2. **Actualizar CONTEXT.md**:
   - Mover tareas completadas a la sección correspondiente
   - Añadir nueva entrada en Notas/Decisiones con timestamp
   - Actualizar "Última actualización"
   - Ajustar "Estado" si ha cambiado

3. **Sincronizar con GitHub** (si aplica):
   - `git add .`
   - `git commit -m "sesión: [resumen de cambios]"`
   - `git push`

4. **Mostrar resumen de la sesión**:
   - Tareas completadas
   - Tareas pendientes para la próxima sesión
   - Estado actual del proyecto

## Notas

- Siempre actualizar CONTEXT.md antes de sincronizar
- El commit message debe ser descriptivo
- Si hay cambios sin commitear, preguntar antes de hacer push
