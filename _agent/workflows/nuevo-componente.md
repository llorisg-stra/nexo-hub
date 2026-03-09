---
description: Crear estructura de nuevo componente (archivo, tests, estilos)
---

# Nuevo Componente

Crea la estructura completa de un nuevo componente.

## Pasos

1. **Preguntar información**:
   - ¿Nombre del componente?
   - ¿En qué carpeta? (frontend/components por defecto)
   - ¿Incluir tests? (sí/no)
   - ¿Incluir estilos? (sí/no)

2. **Crear estructura**:
   ```
   components/
   └── NombreComponente/
       ├── index.tsx          # Componente principal
       ├── NombreComponente.test.tsx  # Tests (si aplica)
       └── NombreComponente.css       # Estilos (si aplica)
   ```

3. **Generar código base**:
   - Componente con props tipadas
   - Test básico
   - Estilos iniciales

4. **Confirmar**: "✅ Componente creado en [ruta]"

## Notas
- Adaptar según stack (React, Vue, etc.)
- Seguir convenciones del proyecto
