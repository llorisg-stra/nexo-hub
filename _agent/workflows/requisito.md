---
description: Documentar nuevo requisito del proyecto
---

# Nuevo Requisito

Documenta un nuevo requisito en docs/requisitos/.

## Pasos

1. **Preguntar información**:
   - ¿Título del requisito?
   - ¿Descripción detallada?
   - ¿Prioridad? (alta, media, baja)
   - ¿Es funcional o no funcional?
   - ¿Quién lo solicitó? (cliente, interno)

2. **Crear archivo** en docs/requisitos/[nombre].md:
   ```markdown
   # [Título]
   
   **Prioridad**: [Alta/Media/Baja]
   **Tipo**: [Funcional/No funcional]
   **Solicitado por**: [Origen]
   **Fecha**: [Fecha]
   **Estado**: Pendiente
   
   ## Descripción
   [Descripción detallada]
   
   ## Criterios de aceptación
   - [ ] [Criterio 1]
   - [ ] [Criterio 2]
   
   ## Notas
   [Notas adicionales]
   ```

3. **Añadir a CONTEXT.md** en próximos pasos si es prioritario

4. **Confirmar**: "✅ Requisito documentado en docs/requisitos/"

## Notas
- Los requisitos deben ser claros y medibles
- Incluir criterios de aceptación siempre que sea posible
