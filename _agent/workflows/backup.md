---
description: Crear backup local del proyecto
---

# Backup

Crea una copia de seguridad del proyecto.

## Pasos

1. **Preguntar destino**:
   - ¿Dónde guardar? (por defecto: ../backups/)
   - ¿Nombre? (por defecto: proyecto_FECHA.zip)

2. **Mostrar qué se incluye**:
   ```
   📦 Se incluirá:
   ✅ Código fuente
   ✅ Documentación
   ✅ Configuración
   
   ❌ Excluido:
   - node_modules/
   - .git/
   - .env (secretos)
   ```

3. **Crear backup**:
```bash
zip -r "../backups/[nombre]_$(date +%Y%m%d).zip" . -x "node_modules/*" -x ".git/*" -x ".env"
```

4. **Confirmar**:
   ```
   ✅ Backup creado: [ruta]
   📊 Tamaño: X MB
   📅 Fecha: [fecha]
   ```

5. **Sugerir**: Subir a cloud storage si es crítico

## Notas
- Los backups no sustituyen a Git
- Útil antes de cambios grandes
- Considerar backups automáticos para producción
