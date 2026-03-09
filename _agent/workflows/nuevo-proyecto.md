---
description: Guía paso a paso para arrancar un proyecto nuevo desde la plantilla
---

# Nuevo Proyecto

Workflow interactivo para configurar un proyecto desde cero.

## Pasos

1. **Pedir usuario de GitHub**:
   - Preguntar: "¿Cuál es tu usuario de GitHub?"
   - Guardar para configurar el repositorio

2. **Pedir nombre del repositorio**:
   - Preguntar: "¿Cómo quieres llamar al repositorio?"
   - Sugerir nombre basado en la carpeta del proyecto

3. **Crear repositorio en GitHub**:
   - Si el usuario tiene GitHub CLI (`gh`) instalado:

     ```bash
     gh repo create [nombre-repo] --private --source=. --remote=origin
     ```

   - Si no, dar instrucciones para crear manualmente en github.com/new
   - Conectar con `git remote add origin`

4. **Inicializar Git**:

   ```bash
   git init
   git add .
   git commit -m "Proyecto inicial desde plantilla"
   git push -u origin main
   ```

5. **Levantar Docker local**:
   - Verificar que Docker Desktop está corriendo
   - Crear `docker-compose.yml` base si no existe (PostgreSQL + app)
   - Ejecutar `docker compose up -d`
   - Verificar que los contenedores están running

6. **Preguntar destino de producción**:
   - "¿Dónde vas a desplegar este proyecto?"
     - **A) Supabase + Vercel** → Ir a paso 7
     - **B) VPS personal** → Ir a paso 8
     - **C) Solo Docker local por ahora** → Ir a paso 9

7. **Si Supabase + Vercel**:
   - Pedir: URL del proyecto Supabase (`SUPABASE_URL`)
   - Pedir: Anon Key (`SUPABASE_ANON_KEY`)
   - Pedir: Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`)
   - Pedir: Token de Vercel (`VERCEL_TOKEN`)
   - Guardar todo en CONTEXT.md

8. **Si VPS personal**:
   - Pedir: IP del servidor
   - Pedir: Usuario SSH
   - Pedir: Dominio (si tiene)
   - Guardar en CONTEXT.md

9. **Rellenar CONTEXT.md**:
   - Actualizar nombre del proyecto
   - Rellenar sección GitHub
   - Rellenar sección Docker
   - Rellenar sección Despliegue según la ruta elegida
   - Marcar checklist completados

10. **Mostrar resumen**:
    - Confirmar todo lo configurado
    - Sugerir próximos pasos

## Notas

- Este workflow se ejecuta UNA VEZ al crear el proyecto
- Siempre arranca con Docker local, independiente del destino final
- Las API keys se guardan en CONTEXT.md (asegurarse de que .gitignore las protege si es necesario)
