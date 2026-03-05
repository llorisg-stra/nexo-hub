---
description: Continuar trabajando en un módulo existente (retomar sesión anterior con protección del código Core)
---

# 🔄 Continuar Módulo

> Este workflow retoma el trabajo en un módulo existente, leyendo el estado guardado para no perder contexto.

## ⛔ REGLAS DE SEGURIDAD (OBLIGATORIAS)

**NUNCA modifiques estos archivos/carpetas mientras trabajas en un módulo:**

- `backend/src/auth/` → Core
- `backend/src/brain/` → Core
- `backend/src/channels/` → Core
- `backend/src/orchestrator/` → Core
- `backend/src/plugins/` → Core
- `backend/src/prisma/` → Core
- `backend/src/storage/` → Core
- `backend/src/admin/` → Core
- `backend/src/ai-provider/` → Core
- `backend/src/secret-vault/` → Core
- `backend/src/app.module.ts` → Core
- `frontend/src/` → Core (a menos que el módulo incluya componentes frontend propios)
- Cualquier archivo fuera de `backend/src/modules/<nombre-modulo>/`

**SOLO puedes editar:**

- `backend/src/modules/<nombre-modulo>/` → Carpeta del módulo
- `backend/src/modules/modules-registry.module.ts` → Solo si hay que actualizar el registro

## Pasos

### 1. Listar módulos disponibles

// turbo
Lista los módulos existentes:

```powershell
Get-ChildItem -Directory backend/src/modules | Where-Object { $_.Name -ne '_template' } | Select-Object Name
```

Muestra la lista al usuario y pregunta: **¿En qué módulo quieres continuar?**

### 2. Leer estado del módulo

Lee el archivo `MODULO-STATE.md` del módulo seleccionado:

```
backend/src/modules/<nombre-modulo>/MODULO-STATE.md
```

Si no existe, lee todos los archivos `.ts` del módulo para reconstruir el contexto y crea el `MODULO-STATE.md`.

### 3. Mostrar resumen al usuario

Muestra:

- **Briefing original**: qué hace el módulo
- **Estado de cada archivo**: completo, parcial, pendiente
- **Tareas pendientes**: qué falta por hacer
- **Última sesión**: qué se hizo y cuándo

Pregunta: **¿Qué quieres hacer hoy?**

- Continuar con las tareas pendientes
- Añadir nueva funcionalidad
- Corregir un bug
- Otra cosa (explicar)

### 4. Trabajar en el módulo

Implementar lo que el usuario pide. Recuerda:

- **SOLO edita archivos dentro de** `backend/src/modules/<nombre-modulo>/`
- Si necesitas un servicio Core, **impórtalo** en el module (`imports: [PrismaModule]`), no lo copies
- Si descubres que algo debería estar en Core, **avisa al usuario** y NO lo implementes en el módulo

### 5. Actualizar estado

Al terminar la sesión (o cuando el usuario diga que para), actualiza `MODULO-STATE.md`:

- Marcar tareas completadas
- Añadir nuevas tareas pendientes si las hay
- Actualizar la fecha y resumen de la última sesión

### 6. Verificar

// turbo

```powershell
cd backend; npx tsc --noEmit
```

Confirmar que no hay errores de compilación.

### 7. Commit

```powershell
git add backend/src/modules/<nombre-modulo>/
git commit -m "feat(modules/<nombre>): <descripción de lo hecho>"
```
