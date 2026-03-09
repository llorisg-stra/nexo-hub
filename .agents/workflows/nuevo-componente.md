---
description: Crear estructura de nuevo componente (archivo, tests, estilos)
---

# Nuevo Componente

Scaffolding para crear un nuevo componente con su estructura completa.

## Pasos

1. **Definir el componente**:
   - Nombre del componente
   - Tipo: servicio, controller, módulo, componente UI, pipe, guard
   - ¿Backend (NestJS) o Frontend (Angular)?

2. **Para Backend (NestJS)**:

   ```bash
   # Generar módulo completo
   nest generate module [nombre]
   nest generate controller [nombre]
   nest generate service [nombre]
   ```

   - Crear archivos: module, controller, service, DTOs, spec

3. **Para Frontend (Angular)**:

   ```bash
   ng generate component [nombre]
   # o
   ng generate service [nombre]
   ```

   - Crear archivos: component.ts, component.html, component.css, component.spec.ts

4. **Configurar**:
   - Añadir imports necesarios
   - Registrar rutas si es una página
   - Añadir al módulo padre

5. **Actualizar CONTEXT.md** con el nuevo componente

## Notas

- Seguir convenciones de nombres del proyecto
- Respetar las reglas arquitectónicas (R1-R6)
- Si es un módulo de negocio, usar /nuevo-modulo en su lugar
