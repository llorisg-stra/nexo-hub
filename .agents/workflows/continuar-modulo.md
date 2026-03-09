---
description: Continuar trabajando en un módulo existente (retomar sesión anterior con protección del código Core)
---

# Continuar Módulo

Retoma el trabajo en un módulo de negocio existente.

## ⚠️ REGLAS INVIOLABLES (siempre activas)

- PROHIBIDO modificar archivos del core (nexo-core)
- Todo cambio se hace SOLO en el repo del módulo
- El módulo es autocontenido

## Pasos

1. **Identificar el módulo**:
   - ¿En qué módulo se va a trabajar?
   - ¿Cuál es su repo?
   - Leer su CONTEXT.md o README

2. **Revisar estado anterior**:
   - Leer sesiones previas
   - Identificar dónde se quedó el trabajo
   - Verificar estado del código

3. **Preparar entorno**:

   ```bash
   cd [ruta-del-módulo]
   git pull origin main
   npm install
   ```

4. **Continuar desarrollo**:
   - Retomar la tarea pendiente
   - Seguir las reglas de Core Purity
   - Documentar progreso

5. **Al terminar**: Actualizar CONTEXT.md del módulo y hacer commit

## Notas

- Siempre leer el contexto antes de empezar a programar
- Si necesitas cambiar algo en el core, DETENERSE y discutir
