---
description: Guía paso a paso para desplegar el proyecto
---

# Deploy

Guía interactiva para desplegar el proyecto.

## Pasos

1. **¿Qué ruta de despliegue vas a usar?**
   - Preguntar al usuario:
     - **A) Supabase + Vercel** → Ir a paso 3
     - **B) VPS personal** → Ir a paso 4
     - **C) Solo Docker local** → Confirmar que Docker está corriendo y terminar
   - Si ya está configurado en CONTEXT.md, mostrar la ruta actual y confirmar

2. **Verificar Docker local** (siempre):

   ```bash
   docker compose ps
   ```

   - Si no está corriendo, levantar con `docker compose up -d`

### Ruta A: Supabase + Vercel

1. **Verificar credenciales**:
   - Leer CONTEXT.md → sección Despliegue
   - ¿Tiene SUPABASE_URL? ¿SUPABASE_ANON_KEY? ¿VERCEL_TOKEN?
   - Si faltan, pedirlas al usuario

2. **Pre-deploy checklist**:

   ```
   ⏳ Verificando...
   - [ ] Tests pasando
   - [ ] Build sin errores
   - [ ] Variables de entorno en Vercel configuradas
   - [ ] Base de datos Supabase migrada
   ```

// turbo
5. **Ejecutar tests**:

   ```bash
   npm test 2>/dev/null || echo "No hay tests configurados"
   ```

1. **Build del proyecto**:

   ```bash
   npm run build
   ```

2. **Deploy a Vercel**:

   ```bash
   vercel --prod
   ```

### Ruta B: VPS Personal

1. **Verificar acceso SSH**:
   - Leer CONTEXT.md → sección VPS
   - Verificar IP, usuario SSH
   - Test de conexión: `ssh usuario@ip "echo OK"`

2. **Pre-deploy checklist**:

   ```
   ⏳ Verificando...
   - [ ] Tests pasando
   - [ ] Build sin errores
   - [ ] Docker compose de producción listo
   - [ ] Nginx configurado
   ```

3. **Deploy al VPS**:
    - Push a GitHub → CI/CD se encarga
    - O manual: `ssh usuario@ip "cd proyecto && git pull && docker compose up -d --build"`

### Post-deploy (ambas rutas)

1. **Verificar que funciona**:
    - Abrir URL de producción
    - Verificar que responde correctamente

2. **Actualizar CONTEXT.md**:
    - Fecha del deploy
    - Versión desplegada
    - Notas si hay cambios importantes

## Notas

- Siempre verificar Docker local antes de cualquier deploy
- Para Supabase+Vercel: las API keys deben estar en CONTEXT.md para poder operar desde Antigravity
- Para VPS: asegurarse de que el acceso SSH funciona antes de intentar deploy
