---
description: Ejecutar tests y mostrar resumen
---

# Tests

Ejecuta la suite de tests y muestra un resumen de resultados.

## Pasos

1. **Ejecutar tests del backend**:

   ```bash
   cd backend
   npm run test
   ```

2. **Ejecutar tests e2e** (si existen):

   ```bash
   cd backend
   npm run test:e2e
   ```

3. **Mostrar resumen**:
   - ✅ Tests pasados
   - ❌ Tests fallidos (con detalle)
   - ⏭️ Tests skipped
   - 📊 Cobertura (si está configurada)

4. **Si hay fallos**:
   - Mostrar el error exacto
   - Sugerir fix
   - Preguntar si se quiere aplicar

## Notas

- Si no hay tests configurados, sugerir crearlos
- Priorizar tests unitarios sobre e2e para feedback rápido
