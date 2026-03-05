---
description: Sincronizar cambios con GitHub (pull + push)
---

# Git Sync

Sincroniza los cambios locales con el repositorio remoto.

## Pasos

// turbo
1. Obtener últimos cambios del remoto:
```bash
git pull --rebase
```

// turbo
2. Añadir todos los cambios locales:
```bash
git add .
```

3. Crear commit con mensaje:
```bash
git commit -m "sync: actualización $(date +%Y-%m-%d)"
```

// turbo
4. Subir cambios al remoto:
```bash
git push
```

## Notas
- Si hay conflictos en el pull, resuélvelos manualmente antes de continuar
- El commit usa la fecha actual automáticamente
