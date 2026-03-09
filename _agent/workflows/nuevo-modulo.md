---
description: Crear un nuevo módulo de negocio para un cliente específico (con protección del código Core)
---

# 🧩 Nuevo Módulo

> Este workflow crea un módulo nuevo en `backend/src/modules/` de forma segura, sin tocar el código Core.

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
- `backend/src/app.module.ts` → Core (excepto el paso de registro)
- `frontend/src/` → Core (a menos que el módulo incluya componentes frontend propios)
- Cualquier archivo fuera de `backend/src/modules/<nombre-modulo>/`

**SOLO puedes editar:**

- `backend/src/modules/<nombre-modulo>/` → Carpeta del módulo (crear/editar)
- `backend/src/modules/modules-registry.module.ts` → Registrar el módulo (una sola línea)
- `backend/src/modules/README.md` → Actualizar inventario (opcional)
- Archivos frontend en una subcarpeta dedicada si el módulo lo requiere

## Pasos

### 1. Briefing del proyecto

Pregunta al usuario lo siguiente (espera respuestas antes de continuar):

1. **¿Nombre del módulo?** (ej: `lamadrid-erp`, `auto-factura`, `crm-basico`)
2. **¿Para qué cliente es?** (ej: GrupoLamadrid, genérico)
3. **¿Qué debe hacer el módulo?** (descripción funcional completa)
4. **¿Qué datos maneja?** (ej: facturas, clientes, inventario)
5. **¿Necesita endpoints REST?** (ej: CRUD de facturas)
6. **¿Necesita tools para la IA?** (ej: que el agente pueda buscar facturas)
7. **¿Necesita acceder a servicios Core?** (ej: PrismaService, BrainService, StorageService)

### 2. Análisis Core vs Módulo

Con las respuestas del briefing, crea un análisis en formato tabla:

| Funcionalidad | ¿Core o Módulo? | Justificación |
|---------------|:----------------:|---------------|
| (cada feature) | Core / Módulo | (por qué) |

**Regla**: si la funcionalidad ya existe en Core, el módulo la **importa**, NO la reimplementa.

Muestra el análisis al usuario y espera confirmación.

### 3. Crear la carpeta del módulo

// turbo
Copia la carpeta `_template/`:

```powershell
Copy-Item -Recurse backend/src/modules/_template backend/src/modules/<nombre-modulo>
```

### 4. Renombrar archivos

Renombra los archivos de `_template.xxx.ts` a `<nombre-modulo>.xxx.ts`:

- `_template.module.ts` → `<nombre>.module.ts`
- `_template.service.ts` → `<nombre>.service.ts`
- `_template.controller.ts` → `<nombre>.controller.ts`
- `index.ts` → mantener (actualizar exports)

### 5. Implementar el módulo

Reemplaza el contenido de los archivos con la lógica real según el briefing:

- **Service**: lógica de negocio
- **Controller**: endpoints REST (si aplica)
- **Module**: imports de Core necesarios
- **Tools** (opcional): crear `<nombre>.tools.ts` con herramientas para el Orchestrator

### 6. Registrar en el registry

Añadir UNA línea en `backend/src/modules/modules-registry.module.ts` para registrar el módulo.

### 7. Crear archivo de estado

Crear `backend/src/modules/<nombre-modulo>/MODULO-STATE.md` con:

```markdown
# Estado del módulo: <nombre>

## Briefing
<resumen del briefing original>

## Archivos
- `<nombre>.module.ts` — [estado: completo/parcial/pendiente]
- `<nombre>.service.ts` — [estado]
- `<nombre>.controller.ts` — [estado]
- `<nombre>.tools.ts` — [estado]

## Pendiente
- [ ] (tareas pendientes)

## Última sesión
Fecha: YYYY-MM-DD
Resumen: (qué se hizo)
```

### 8. Verificar

// turbo

```powershell
cd backend; npx tsc --noEmit
```

Confirmar que no hay errores de compilación.

### 9. Commit

```powershell
git add backend/src/modules/<nombre-modulo>/ backend/src/modules/modules-registry.module.ts
git commit -m "feat(modules): nuevo módulo <nombre> — <descripción corta>"
```
