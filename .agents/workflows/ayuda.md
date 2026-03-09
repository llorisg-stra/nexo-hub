---
description: Mostrar lista de todos los comandos disponibles
---

# Ayuda

Muestra todos los workflows/comandos disponibles organizados por categoría.

## Pasos

1. **Listar comandos disponibles** organizados por categoría:

### 🔄 Gestión de Sesión

| Comando | Descripción |
|---------|-------------|
| `/inicio` | Iniciar sesión de trabajo |
| `/fin` | Finalizar sesión y guardar progreso |
| `/git-sync` | Sincronizar con GitHub |

### 📋 Contexto

| Comando | Descripción |
|---------|-------------|
| `/contexto` | Menú de gestión de contexto |
| `/ver-contexto` | Ver contexto completo |
| `/actualizar-contexto` | Actualizar CONTEXT.md |

### 💻 Desarrollo

| Comando | Descripción |
|---------|-------------|
| `/nuevo-componente` | Crear nuevo componente |
| `/nuevo-modulo` | Crear módulo de negocio |
| `/continuar-modulo` | Continuar trabajo en módulo |
| `/nuevo-proyecto` | Arrancar proyecto desde plantilla |
| `/test` | Ejecutar tests |
| `/debug` | Diagnosticar errores |
| `/deploy` | Desplegar proyecto |

### 📝 Documentación

| Comando | Descripción |
|---------|-------------|
| `/api` | Documentar API |
| `/decision` | Registrar decisión técnica |
| `/requisito` | Documentar requisito |
| `/recurso` | Añadir recurso externo |
| `/meeting` | Notas de reunión |
| `/documento` | Añadir documento |

### 📊 Proyecto

| Comando | Descripción |
|---------|-------------|
| `/mapa` | Ver estructura del proyecto |
| `/tareas` | Ver tareas pendientes |
| `/cliente` | Feedback de cliente |
| `/presupuesto` | Costes y gastos |

### 🔧 Utilidades

| Comando | Descripción |
|---------|-------------|
| `/buscar` | Buscar en todo el proyecto |
| `/limpiar` | Limpiar archivos temporales |
| `/backup` | Crear backup |
| `/importar-github` | Importar proyecto de GitHub |
| `/ayuda` | Esta ayuda |

## Notas

- Usa cualquier comando escribiendo `/nombre-del-comando`
- Los comandos leen y actualizan CONTEXT.md automáticamente
