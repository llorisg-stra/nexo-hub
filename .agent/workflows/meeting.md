---
description: Documentar notas de reunión
---

# Meeting

Documenta notas de una reunión.

## Pasos

1. **Preguntar información**:
   - ¿Título/tema de la reunión?
   - ¿Con quién? (participantes)
   - ¿Fecha? (hoy por defecto)

2. **Durante la reunión** (o después):
   - Pedir puntos clave discutidos
   - Pedir decisiones tomadas
   - Pedir action items

3. **Crear archivo** en docs/referencias/meetings/[fecha]-[tema].md:
   ```markdown
   # Reunión: [Tema]
   
   **Fecha**: [Fecha]
   **Participantes**: [Lista]
   
   ## Puntos discutidos
   - [Punto 1]
   - [Punto 2]
   
   ## Decisiones
   - [Decisión 1]
   - [Decisión 2]
   
   ## Action Items
   - [ ] [Tarea] - @[Responsable]
   - [ ] [Tarea] - @[Responsable]
   
   ## Próxima reunión
   [Fecha/tema si aplica]
   ```

4. **Actualizar CONTEXT.md**:
   - Añadir decisiones relevantes
   - Añadir action items a próximos pasos

5. **Confirmar**: "✅ Reunión documentada"

## Notas
- Documentar reuniones ayuda a no olvidar acuerdos
- Los action items deben tener responsable
