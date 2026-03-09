---
description: Importar un proyecto existente desde GitHub
---

# Importar desde GitHub

Clona e integra un proyecto existente desde GitHub al entorno local.

## Pasos

1. **Identificar el repositorio**:
   - URL del repo
   - Rama a clonar (default: main)
   - ¿Es público o privado?

2. **Clonar**:

   ```bash
   git clone https://github.com/[usuario]/[repo].git
   cd [repo]
   ```

3. **Verificar estructura**:
   - ¿Tiene package.json? → Instalar dependencias
   - ¿Tiene .env.example? → Crear .env
   - ¿Tiene docker-compose.yml? → Verificar config
   - ¿Tiene CONTEXT.md? → Leerlo

4. **Instalar dependencias**:

   ```bash
   npm install
   ```

5. **Crear CONTEXT.md** si no existe (con /contexto)

6. **Verificar** que el proyecto funciona localmente

## Notas

- Si es repo privado, verificar acceso SSH/HTTPS
- Si hay submodules, usar `git clone --recursive`
- Añadir a la lista de repos en CONTEXT.md del proyecto principal
