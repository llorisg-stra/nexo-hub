---
description: Buscar en todo el proyecto (código + docs)
---

# Buscar

Busca en todo el proyecto.

## Pasos

1. **Preguntar**:
   - ¿Qué quieres buscar?
   - ¿Dónde? (código, docs, todo)

2. **Ejecutar búsqueda**:

// turbo
```bash
grep -r "[TÉRMINO]" --include="*.js" --include="*.ts" --include="*.py" --include="*.md" --include="*.json" . 2>/dev/null | head -30
```

3. **Mostrar resultados**:
   ```
   🔍 Resultados para "[término]"
   
   📄 archivo1.js:23
      > línea con el término
   
   📄 docs/api.md:45
      > otra línea con el término
   
   📊 Total: X coincidencias en Y archivos
   ```

4. **Ofrecer opciones**:
   - "¿Quieres ver algún archivo completo?"
   - "¿Buscar algo más?"

## Notas
- Excluir node_modules, .git, etc.
- Limitar resultados para no saturar
