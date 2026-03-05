---
description: Ayuda a diagnosticar y resolver errores
---

# Debug

Asistente para diagnosticar errores.

## Pasos

1. **Recopilar información**:
   - ¿Cuál es el error? (pegar mensaje)
   - ¿Dónde ocurre? (archivo, línea, acción)
   - ¿Qué estabas haciendo cuando pasó?

2. **Analizar error**:
   - Buscar el error en el código
   - Identificar posibles causas
   - Revisar cambios recientes

3. **Buscar en el proyecto**:
// turbo
```bash
git log --oneline -5
```

4. **Proponer soluciones**:
   - Listar posibles causas ordenadas por probabilidad
   - Sugerir pasos para cada solución

5. **Aplicar fix**:
   - Si el usuario acepta, aplicar la solución
   - Ejecutar tests para verificar

6. **Documentar**:
   - Si es un bug importante, añadir nota en CONTEXT.md

## Notas
- Pedir siempre el mensaje de error completo
- Revisar logs si están disponibles
