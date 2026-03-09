---
description: Importar un proyecto existente desde GitHub
---

# Importar desde GitHub

Clona un repositorio existente de GitHub y lo prepara para trabajar con la plantilla.

## Pasos

1. **Pedir la URL del repositorio**:
   - Preguntar: "¿Cuál es la URL del repositorio de GitHub?"
   - Acepta formatos:
     - `https://github.com/usuario/repo`
     - `https://github.com/usuario/repo.git`
     - `usuario/repo` (se autocompleta)

2. **¿Es un repo privado?**
   - Si es privado, verificar que tiene acceso:
     - GitHub CLI: `gh auth status`
     - O pedir Personal Access Token (PAT)
   - Si es público, continuar directamente

3. **¿Dónde clonar?**
   - Preguntar: "¿Quieres clonar en la carpeta actual o en una nueva?"
   - Opción A: Carpeta actual (si está vacía)
   - Opción B: Nueva carpeta con el nombre del repo

4. **Clonar el repositorio**:

   ```bash
   git clone https://github.com/usuario/repo.git [carpeta]
   ```

   - Si necesita token:

   ```bash
   git clone https://[TOKEN]@github.com/usuario/repo.git [carpeta]
   ```

5. **Verificar el contenido clonado**:
   - Mostrar estructura de carpetas
   - Detectar stack (package.json, requirements.txt, .csproj, etc.)
   - Verificar si ya tiene docker-compose.yml

6. **¿Añadir estructura de plantilla?**
   - Preguntar: "¿Quieres añadir la estructura de la plantilla (CONTEXT.md, workflows, docs/)?"
   - Si sí:
     - Copiar `.agent/workflows/` al proyecto
     - Crear `CONTEXT.md` con los datos detectados
     - Crear carpetas de docs/ si no existen
   - Si no: dejarlo como está

7. **Levantar Docker local**:
   - Si tiene `docker-compose.yml` → `docker compose up -d`
   - Si no tiene, preguntar si quiere crear uno base
   - Verificar que los contenedores están corriendo

8. **Instalar dependencias** (si aplica):
   - Detectar gestor de paquetes y ejecutar:
     - `npm install` / `yarn` / `pnpm install`
     - `pip install -r requirements.txt`
     - `dotnet restore`

9. **Mostrar resumen**:
   - Repo clonado correctamente
   - Stack detectado
   - Docker: estado
   - Próximos pasos sugeridos

## Notas

- Si el repo ya tiene CONTEXT.md, no sobreescribirlo
- Respetar la configuración existente del proyecto
- El token de GitHub NO se guarda en ningún archivo del repo (usar git credential manager o variables de entorno)
