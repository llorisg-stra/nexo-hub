---
description: Limpiar archivos temporales y dependencias
---

# Limpiar

Limpia archivos temporales y libera espacio.

## Pasos

1. **Mostrar qué se puede limpiar**:
   ```
   🧹 Archivos a limpiar:
   
   - node_modules/     [X MB]
   - .next/            [X MB]
   - dist/             [X MB]
   - __pycache__/      [X MB]
   - .DS_Store        [varios]
   
   Total recuperable: X MB
   ```

2. **Preguntar confirmación**:
   - ¿Limpiar todo?
   - ¿Solo algunos?

3. **Ejecutar limpieza** (con confirmación):
```bash
# Solo si el usuario confirma
rm -rf node_modules .next dist build __pycache__
find . -name ".DS_Store" -delete
find . -name "*.pyc" -delete
```

4. **Mostrar resultado**:
   - Espacio liberado
   - Recordar: `npm install` para reinstalar dependencias

## Notas
- Siempre pedir confirmación antes de borrar
- No borrar .git ni archivos importantes
