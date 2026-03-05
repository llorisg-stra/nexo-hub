---
description: Registrar feedback o petición de cliente
---

# Feedback de Cliente

Registra feedback, petición o comentario de cliente.

## Pasos

1. **Preguntar información**:
   - ¿Nombre del cliente?
   - ¿Tipo? (feedback, bug, petición de feature, queja)
   - ¿Descripción?
   - ¿Prioridad percibida por cliente? (urgente, normal, cuando puedas)

2. **Crear registro** en docs/requisitos/cliente/[fecha]-[tipo].md:
   ```markdown
   # [Tipo]: [Resumen]
   
   **Cliente**: [Nombre]
   **Fecha**: [Fecha]
   **Tipo**: [Feedback/Bug/Feature/Queja]
   **Prioridad cliente**: [Urgente/Normal/Baja]
   **Estado**: Pendiente de revisar
   
   ## Descripción
   [Lo que dijo el cliente]
   
   ## Análisis interno
   [Tu análisis]
   
   ## Acción a tomar
   - [ ] [Acción]
   ```

3. **Decidir acción**:
   - ¿Es un bug? → Añadir a tareas
   - ¿Es feature? → Evaluar y documentar como requisito
   - ¿Es feedback? → Archivar para referencia

4. **Confirmar**: "✅ Feedback registrado"

## Notas
- Todo feedback de cliente es valioso
- Responder al cliente si aplica
