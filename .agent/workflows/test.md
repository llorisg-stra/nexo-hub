---
description: Ejecutar tests y mostrar resumen
---

# Test

Ejecuta los tests del proyecto y muestra resumen.

## Pasos

1. **Detectar framework de tests**:
   - Revisar package.json o configuración

// turbo
2. **Ejecutar tests**:
```bash
npm test 2>&1 || yarn test 2>&1 || echo "No se encontró comando de tests"
```

3. **Mostrar resumen**:
   ```
   🧪 RESULTADOS DE TESTS
   
   ✅ Pasados: X
   ❌ Fallidos: X
   ⏭️ Saltados: X
   
   📊 Cobertura: X%
   ```

4. **Si hay fallos**:
   - Mostrar detalle de cada test fallido
   - Ofrecer: "¿Quieres que te ayude a arreglar alguno?"

5. **Actualizar** testing/README.md con última ejecución

## Notas
- Soportar Jest, Vitest, Mocha, pytest, etc.
- Mostrar tiempo de ejecución
