---
description: Actualizar costes y gastos del proyecto
---

# Presupuesto

Actualiza información financiera del proyecto.

## Pasos

1. **Leer finanzas/README.md** actual

2. **Mostrar menú**:
   ```
   💰 Gestión de Presupuesto
   
   1. 📊 Ver resumen actual
   2. ➕ Añadir gasto
   3. ➕ Añadir ingreso
   4. 📝 Actualizar presupuesto
   5. 📈 Ver balance
   ```

3. **Según opción**:

   **Añadir gasto**:
   - ¿Concepto?
   - ¿Cantidad?
   - ¿Categoría? (desarrollo, hosting, marketing, otro)
   - ¿Fecha?

   **Ver balance**:
   - Mostrar presupuesto vs real
   - Alertar si hay desvíos importantes

4. **Actualizar finanzas/README.md**:
   ```markdown
   | Fecha | Concepto | Categoría | Importe |
   |-------|----------|-----------|---------|
   | [Fecha] | [Concepto] | [Cat] | €[X] |
   ```

5. **Confirmar**: "✅ Presupuesto actualizado"

## Notas
- Mantener registro de todos los gastos
- Revisar periódicamente el balance
