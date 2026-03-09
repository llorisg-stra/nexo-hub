---
description: Sincronizar cambios con GitHub (pull + push)
---

# Git Sync

Sincroniza el repositorio local con GitHub de forma segura.

## Pasos

1. **Verificar estado del repositorio**:

   ```bash
   git status
   git log --oneline -3
   ```

2. **Pull cambios remotos** (si hay):

   ```bash
   git pull --rebase origin main
   ```

3. **Resolver conflictos** si los hay (preguntar al usuario)

4. **Añadir cambios locales**:

   ```bash
   git add .
   git status
   ```

5. **Confirmar con el usuario** el mensaje de commit

6. **Commit y push**:

   ```bash
   git commit -m "[mensaje descriptivo]"
   git push origin main
   ```

7. **Verificar** que el push fue exitoso

## Notas

- Siempre hacer pull antes de push
- Preguntar al usuario antes de hacer commit
- Si hay archivos sensibles (.env), verificar que están en .gitignore
- Usar mensajes de commit descriptivos en español
