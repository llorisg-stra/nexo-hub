---
description: Añadir documento externo al proyecto (PDF, DOCX, imágenes, etc.)
---

# Añadir Documento

Añade un documento externo al proyecto, lo registra y extrae su contenido.

## Tipos soportados

- **Documentos**: PDF, DOCX, TXT, MD
- **Imágenes**: PNG, JPG, JPEG, GIF, WEBP
- **Datos**: CSV, JSON
- **Otros**: Se guardan y registran sin extracción de contenido

## Pasos

1. **Preguntar origen del documento**:
   - ¿Ruta del archivo? (puede estar en cualquier lugar del sistema)
   - Si no se proporciona, preguntar
   - Aceptar múltiples archivos si se proporcionan

2. **Detectar tipo de archivo**:
   - Documento de texto → Extraer contenido
   - Imagen → Analizar y describir contenido visual
   - Datos → Parsear estructura

3. **Leer y analizar el contenido**:
   - Para documentos: extraer texto
   - Para imágenes: describir lo que se ve (mockup, diagrama, captura, foto)
   - Identificar temas principales

4. **SUGERIR categoría automáticamente** basándose en el contenido:
   ```
   Analizando contenido...
   
   📄 Tipo: [PDF/Imagen/etc.]
   📊 Contenido detectado: [descripción breve]
   
   💡 Categoría sugerida: [CATEGORÍA]
   
   Categorías disponibles:
   1. Requisitos - Especificaciones, requisitos funcionales
   2. Especificaciones - Documentos técnicos, APIs
   3. Contratos - Acuerdos, términos legales
   4. Diseño - Mockups, wireframes, UI
   5. Diagramas - Flujos, arquitectura, procesos
   6. Referencias - Documentación externa, guías
   7. Capturas - Screenshots, evidencias
   8. Otros
   
   ¿Confirmas [SUGERIDA] o prefieres otra? (número o Enter para confirmar)
   ```

5. **Preguntar metadatos adicionales**:
   - ¿Título/nombre descriptivo? (sugerir basado en nombre de archivo)
   - ¿Descripción breve? (sugerir basado en contenido)

6. **Copiar archivo a la carpeta del proyecto**:
   - Documentos → `docs/conocimiento/originales/`
   - Imágenes → `docs/conocimiento/originales/imagenes/`
   - Si ya existe, preguntar si sobrescribir

7. **Crear resumen estructurado**:
   - Crear archivo: `docs/conocimiento/resumenes/[nombre].md`
   - Formato para documentos:
   ```markdown
   # [Título del documento]
   
   **Archivo original**: `originales/[nombre]`
   **Tipo**: [PDF/DOCX/etc.]
   **Categoría**: [categoría]
   **Fecha de adición**: [fecha]
   **Descripción**: [descripción breve]
   
   ---
   
   ## Resumen
   [Resumen del contenido principal]
   
   ## Puntos Clave
   - [Punto 1]
   - [Punto 2]
   - [Punto 3]
   
   ## Información Relevante para el Proyecto
   [Cómo afecta o es útil para el proyecto]
   ```
   
   - Formato para imágenes:
   ```markdown
   # [Título de la imagen]
   
   **Archivo original**: `originales/imagenes/[nombre]`
   **Tipo**: Imagen ([PNG/JPG/etc.])
   **Categoría**: [Diseño/Diagrama/Captura/etc.]
   **Fecha de adición**: [fecha]
   
   ---
   
   ## Vista previa
   ![Imagen](../originales/imagenes/[nombre])
   
   ## Descripción
   [Descripción detallada de lo que muestra la imagen]
   
   ## Elementos identificados
   - [Elemento 1]
   - [Elemento 2]
   
   ## Relevancia para el proyecto
   [Por qué es importante o cómo se usa]
   ```

8. **Actualizar REGISTRO.md**:
   - Añadir entrada a la tabla de documentos
   - Incrementar contador de estadísticas
   - Añadir a la categoría correspondiente
   - Añadir resumen corto en sección de resúmenes

9. **Actualizar CONTEXT.md**:
   - Añadir referencia en sección "Recursos Importantes"

10. **Confirmar al usuario**:
    ```
    ✅ Documento añadido correctamente
    
    📄 Archivo: docs/conocimiento/originales/[nombre]
    🏷️ Categoría: [categoría]
    📝 Resumen: docs/conocimiento/resumenes/[nombre].md
    📊 Registro actualizado
    📋 CONTEXT.md actualizado
    
    💡 Para consultar este documento después:
    "¿Qué dice el documento [nombre] sobre [tema]?"
    
    🔍 Para buscar en todos los documentos:
    "Busca en los documentos del proyecto [tema]"
    ```

## Categorías y cuándo sugerirlas

| Si el contenido contiene... | Sugerir |
|-----------------------------|---------|
| Funcionalidades, requisitos, historias de usuario | Requisitos |
| APIs, endpoints, esquemas técnicos | Especificaciones |
| Términos legales, acuerdos, firmas | Contratos |
| UI, mockups, wireframes, diseños visuales | Diseño |
| Flujos, arquitectura, procesos, flechas | Diagramas |
| Documentación, tutoriales, guías | Referencias |
| Screenshots de apps, webs, errores | Capturas |
| No encaja en ninguna | Otros |

## Notas
- Los documentos se sincronizan con Git automáticamente
- El resumen permite acceso rápido sin abrir el original
- Las imágenes se pueden ver desde el resumen en Markdown
- Para ver todos los documentos: `/ver-contexto` o lee `docs/conocimiento/REGISTRO.md`
