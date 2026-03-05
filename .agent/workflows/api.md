---
description: Documentar una nueva API externa
---

# Añadir API

Documenta una nueva API externa en el proyecto.

## Pasos

1. **Preguntar información de la API**:
   - Nombre de la API
   - URL base / documentación
   - ¿Para qué se usa en el proyecto?
   - ¿Requiere autenticación? (API key, OAuth, etc.)

2. **Crear archivo** en `docs/apis/[nombre-api].md`:
   ```markdown
   # [Nombre API]
   
   ## Información
   - **URL**: [url]
   - **Documentación**: [enlace]
   - **Uso**: [descripción]
   
   ## Autenticación
   - **Tipo**: [API key/OAuth/etc]
   - **Variable de entorno**: API_[NOMBRE]_KEY
   
   ## Endpoints usados
   | Endpoint | Método | Descripción |
   |----------|--------|-------------|
   | /ejemplo | GET | [descripción] |
   
   ## Ejemplos
   [código de ejemplo]
   ```

3. **Recordar**: Añadir la variable de entorno a `.env.example`

4. **Actualizar CONTEXT.md** con la nueva integración

## Notas
- Nunca guardar API keys en el archivo, solo el nombre de la variable
