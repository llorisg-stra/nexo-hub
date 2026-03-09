---
description: Crear backup local del proyecto
---

# Backup

Crea un snapshot/backup del estado actual del proyecto.

## Pasos

1. **Verificar estado actual**:
   - ¿Hay cambios sin commitear?
   - ¿Cuál es el último commit?

2. **Crear backup**:
   - Opción A: Git tag con fecha

     ```bash
     git tag backup-YYYY-MM-DD
     git push origin --tags
     ```

   - Opción B: Copia comprimida local

     ```bash
     tar -czf backup-proyecto-YYYY-MM-DD.tar.gz --exclude=node_modules --exclude=dist .
     ```

3. **Verificar** que el backup se creó correctamente

4. **Registrar** en CONTEXT.md:

   ```markdown
   - Backup creado: [fecha] — [método] — [ubicación]
   ```

## Notas

- Siempre excluir node_modules y dist del backup
- Para bases de datos, usar pg_dump separadamente
- Mantener al menos los 3 últimos backups
