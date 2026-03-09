---
description: Ver estructura y estado de todas las secciones del proyecto
---

# Mapa del Proyecto

Visualiza la estructura completa del proyecto con estado de cada componente.

## Pasos

1. **Escanear estructura de directorios** del proyecto

2. **Mostrar árbol visual**:

   ```
   proyecto/
   ├── backend/
   │   ├── src/
   │   │   ├── modulo-1/  ✅
   │   │   ├── modulo-2/  🔄
   │   │   └── ...
   │   └── packages/      📦
   ├── frontend/
   │   └── src/
   │       ├── pages/     ✅
   │       └── components/
   └── scripts/
   ```

3. **Estadísticas**:
   - Total de archivos por tipo (.ts, .html, .css)
   - Módulos backend (contando carpetas en src/)
   - Páginas frontend
   - Extensiones instaladas (packages/)

4. **Identificar áreas** con archivos modificados recientemente

## Notas

- Usar emojis de estado: ✅ completo, 🔄 en progreso, ❌ con errores, 📦 extensión
- No mostrar node_modules, dist, ni archivos generados
