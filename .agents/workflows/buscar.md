---
description: Buscar en todo el proyecto (código + docs)
---

# Buscar

Búsqueda inteligente en todo el proyecto: código fuente, documentación y configuración.

## Pasos

1. **Preguntar qué buscar**:
   - Término o patrón
   - ¿En código, docs, o todo?
   - ¿Case-sensitive?

2. **Buscar en código**:

   ```bash
   grep -rn "[término]" --include="*.ts" --include="*.html" --include="*.json" src/
   ```

3. **Buscar en documentación**:

   ```bash
   grep -rn "[término]" --include="*.md" .
   ```

4. **Mostrar resultados agrupados**:
   - Por archivo
   - Con contexto (líneas alrededor del match)
   - Ordenados por relevancia

5. **Ofrecer acciones**: ¿Quieres editar alguno de estos archivos?

## Notas

- Excluir node_modules, dist, y archivos generados
- Si no hay resultados, sugerir términos alternativos
- Usar regex si el usuario lo necesita
