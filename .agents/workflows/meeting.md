---
description: Documentar notas de reunión
---

# Notas de Reunión

Registra y procesa las notas de una reunión, extrayendo tareas y decisiones.

## Pasos

1. **Recopilar información**:
   - Fecha y participantes
   - Tema principal
   - Notas crudas (el usuario las pega o dicta)

2. **Procesar notas**:
   - Extraer **decisiones** tomadas
   - Extraer **tareas asignadas** (quién, qué, cuándo)
   - Extraer **bloqueos** o dependencias
   - Resumir puntos clave

3. **Generar acta formateada**:

   ```markdown
   ## 📝 Reunión — [Fecha]
   **Participantes**: [lista]
   **Tema**: [tema]
   
   ### Decisiones
   - [decisión 1]
   
   ### Tareas
   - [ ] [tarea] — Asignado a: [persona] — Deadline: [fecha]
   
   ### Notas
   - [punto clave]
   ```

4. **Actualizar CONTEXT.md** con decisiones relevantes
5. **Añadir tareas** a próximos pasos

## Notas

- Las decisiones de reunión deben registrarse en CONTEXT.md
- Las tareas deben tener responsable y deadline
