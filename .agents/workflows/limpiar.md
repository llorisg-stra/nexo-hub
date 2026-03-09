---
description: Limpiar archivos temporales y dependencias
---

# Limpiar

Elimina archivos temporales, caches y dependencias obsoletas.

## Pasos

1. **Identificar archivos limpiables**:
   - `node_modules/` (se puede reinstalar)
   - `dist/` (se puede rebuildar)
   - `.next/` o `.angular/` (cache de build)
   - Archivos `.log`
   - Archivos temporales

2. **Mostrar espacio a recuperar**:

   ```bash
   du -sh node_modules/ dist/ .angular/
   ```

3. **Confirmar con el usuario** qué limpiar

4. **Ejecutar limpieza**:

   ```bash
   rm -rf node_modules/ dist/ .angular/
   # Reinstalar dependencias
   npm install
   ```

5. **Verificar** que el proyecto sigue funcionando

## Notas

- NUNCA limpiar sin confirmación del usuario
- Siempre poder reinstalar lo que se borra
- No borrar .env ni archivos de configuración
