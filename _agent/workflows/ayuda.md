---
description: Mostrar lista de todos los comandos disponibles
---

# Ayuda

Muestra todos los comandos disponibles.

## Pasos

1. **Listar todos los workflows** en .agent/workflows/

2. **Mostrar en formato organizado**:

   ```
   🤖 COMANDOS DISPONIBLES
   
   🔄 Flujo de trabajo
   ├── /nuevo-proyecto   - ⭐ Arrancar proyecto nuevo
   ├── /importar-github  - 📥 Importar proyecto de GitHub
   ├── /inicio           - Empezar sesión
   ├── /fin              - Terminar sesión + sync
   └── /git-sync         - Sincronizar con GitHub
   
   📋 Contexto
   ├── /contexto      - Gestionar contexto
   ├── /ver-contexto  - Ver todo el contexto
   └── /actualizar-contexto - Actualización rápida
   
   💻 Desarrollo
   ├── /nuevo-componente - Crear componente
   ├── /test            - Ejecutar tests
   ├── /debug           - Diagnosticar errores
   └── /deploy          - Guía de deploy
   
   📝 Documentación
   ├── /api       - Documentar API
   ├── /decision  - Documentar decisión
   ├── /requisito - Nuevo requisito
   ├── /recurso   - Añadir recurso
   └── /meeting   - Notas de reunión
   
   📊 Proyecto
   ├── /mapa        - Ver estructura
   ├── /tareas      - Ver pendientes
   ├── /cliente     - Feedback de cliente
   └── /presupuesto - Gestionar finanzas
   
   🔧 Utilidades
   ├── /buscar  - Buscar en proyecto
   ├── /limpiar - Limpiar temporales
   ├── /backup  - Crear backup
   └── /ayuda   - Esta ayuda
   
   🔗 Integraciones
   ├── /n8n   - Gestionar workflow N8N
   ├── /teams - Enviar a Teams
   └── /env   - Gestionar variables
   ```

3. **Ofrecer**: "¿Quieres más info sobre algún comando?"

## Notas

- Este es el punto de entrada para nuevos usuarios
- Mantener actualizado cuando se añadan comandos
