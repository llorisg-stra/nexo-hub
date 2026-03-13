#!/bin/bash
# =============================================================================
# Nexo Hub — Deploy Nexo Core Instance
# Despliega una instancia nueva de nexo-core en un VPS preparado
#
# Uso (desde local):
#   ssh nexo-core-1 "bash -s" < scripts/deploy-nexo-core.sh lamadrid lamadrid.nexo.strategialaboratory.com
#
# O directamente en el VPS:
#   bash deploy-nexo-core.sh <CLIENT_NAME> <DOMAIN>
# =============================================================================

set -euo pipefail

# --- Parámetros ---
CLIENT_NAME="${1:?ERROR: Falta CLIENT_NAME (ej: lamadrid)}"
DOMAIN="${2:?ERROR: Falta DOMAIN (ej: lamadrid.nexo.strategialaboratory.com)}"
REPO_URL="${3:-https://github.com/strategialabsorg/nexo-core.git}"
BRANCH="${4:-main}"

# --- Configuración ---
BASE_DIR="$HOME/instances"
INSTANCE_DIR="$BASE_DIR/$CLIENT_NAME"

# --- Cloudflare ---
CF_ZONE_ID="34cb3d9799daa0faf4fcc72c6ce0d3c4"
CF_API_TOKEN="nTp9-og_77VDbGe9CbWy1gDMK_TYUtXK7X2VPXdM"
CF_API="https://api.cloudflare.com/client/v4"

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[NEXO]${NC} $1"; }
ok()  { echo -e "${GREEN}[✅]${NC} $1"; }
err() { echo -e "${RED}[❌]${NC} $1"; exit 1; }

TOTAL_STEPS=8
STEP=0
step() { STEP=$((STEP+1)); echo ""; log "=== Step $STEP/$TOTAL_STEPS: $1 ==="; }

# --- Generar contraseñas seguras (hex only, sin caracteres especiales) ---
gen_pass() { openssl rand -hex 24; }

echo ""
echo "========================================="
echo "  NEXO CORE — Desplegando instancia"
echo "========================================="
echo "  Cliente:  $CLIENT_NAME"
echo "  Dominio:  $DOMAIN"
echo "  Repo:     $REPO_URL ($BRANCH)"
echo "  Dir:      $INSTANCE_DIR"
echo "========================================="

# =============================================================================
step "Verificar prerequisitos"
# =============================================================================
command -v docker &>/dev/null || err "Docker no instalado. Ejecuta setup-vps.sh primero"
command -v nginx &>/dev/null  || err "Nginx no instalado. Ejecuta setup-vps.sh primero"
command -v git &>/dev/null    || err "Git no instalado. Ejecuta setup-vps.sh primero"
docker ps &>/dev/null         || err "No se puede ejecutar Docker. ¿Estás en el grupo docker?"
ok "Todos los prerequisitos OK"

# =============================================================================
step "Clonar nexo-core"
# =============================================================================
if [ -d "$INSTANCE_DIR" ]; then
    log "El directorio ya existe. Actualizando..."
    cd "$INSTANCE_DIR"
    git fetch origin
    git reset --hard origin/$BRANCH
    ok "Repositorio actualizado"
else
    mkdir -p "$BASE_DIR"
    git clone --branch "$BRANCH" "$REPO_URL" "$INSTANCE_DIR"
    cd "$INSTANCE_DIR"
    ok "Repositorio clonado en $INSTANCE_DIR"
fi

# =============================================================================
step "Generar archivo .env"
# =============================================================================
cd "$INSTANCE_DIR"

if [ -f .env ]; then
    log "Archivo .env ya existe, no se sobreescribe"
    ok "Usando .env existente"
else
    DB_PASS=$(gen_pass)
    REDIS_PASS=$(gen_pass)
    N8N_PASS=$(gen_pass)
    ENCRYPTION_KEY=$(openssl rand -hex 16)
    ENCRYPTION_SALT=$(openssl rand -hex 16)
    N8N_WEBHOOK_SECRET=$(openssl rand -hex 16)

    # --- Auto-detectar puertos libres ---
    # Base ports: 3000(backend), 4200(frontend), 5432(db), 6379(redis), 5678(n8n), 8080(adminer)
    # Cada instancia incrementa en slot de 10: inst 0 = base, inst 1 = +10, inst 2 = +20...
    USED_PORTS=$(ss -tlnp | awk '{print $4}' | grep -oP ':\K[0-9]+' | sort -n | uniq)
    find_free_port() {
        local base=$1
        local port=$base
        while echo "$USED_PORTS" | grep -qw "$port"; do
            port=$((port + 10))
        done
        echo $port
    }

    P_BACKEND=$(find_free_port 3000)
    P_FRONTEND=$(find_free_port 4200)
    P_DB=$(find_free_port 5432)
    P_REDIS=$(find_free_port 6379)
    P_N8N=$(find_free_port 5678)
    P_ADMINER=$(find_free_port 8080)

    log "Puertos asignados: backend=$P_BACKEND frontend=$P_FRONTEND db=$P_DB redis=$P_REDIS n8n=$P_N8N adminer=$P_ADMINER"

    cat > .env << EOF
# =============================================================================
# Nexo Core — $CLIENT_NAME
# Generado automáticamente: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# =============================================================================

# --- Identificación ---
CLIENT_NAME=$CLIENT_NAME

# --- Base de datos (PostgreSQL) ---
POSTGRES_USER=admin
POSTGRES_PASSWORD=$DB_PASS
POSTGRES_DB=nexo_${CLIENT_NAME}
DATABASE_URL=postgresql://admin:${DB_PASS}@db:5432/nexo_${CLIENT_NAME}?schema=app

# --- Redis ---
REDIS_PASSWORD=$REDIS_PASS

# --- n8n ---
N8N_USER=admin
N8N_PASSWORD=$N8N_PASS
N8N_WEBHOOK_SECRET=$N8N_WEBHOOK_SECRET

# --- Seguridad ---
ENCRYPTION_KEY=$ENCRYPTION_KEY
ENCRYPTION_SALT=$ENCRYPTION_SALT

# --- Supabase (configurar desde el Hub) ---
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# --- Panel (Nexo Hub) ---
PANEL_API_URL=https://panel.strategialaboratory.com
PANEL_API_KEY=

# --- CORS ---
CORS_ORIGINS=https://$DOMAIN

# --- Puertos (auto-asignados) ---
PORT_BACKEND=$P_BACKEND
PORT_FRONTEND=$P_FRONTEND
PORT_DB=$P_DB
PORT_REDIS=$P_REDIS
PORT_N8N=$P_N8N
PORT_ADMINER=$P_ADMINER

# --- Tenant ---
TENANT_ID=
ACTIVE_MODULES=

# --- RAG/OCR (via VPN) ---
RAG_URL=http://10.0.0.1:8080
EOF

    ok "Archivo .env generado con contraseñas únicas"
fi

# =============================================================================
step "Docker Compose — Build & Up"
# =============================================================================
cd "$INSTANCE_DIR"

if [ -f docker-compose.yml ] || [ -f docker-compose.yaml ]; then
    # Prefixar con el nombre del cliente para aislar redes y contenedores
    export COMPOSE_PROJECT_NAME="nexo-${CLIENT_NAME}"
    docker compose up -d --build
    ok "Contenedores levantados como proyecto 'nexo-${CLIENT_NAME}'"
else
    err "No se encontró docker-compose.yml en $INSTANCE_DIR"
fi

# =============================================================================
step "Inicializar base de datos"
# =============================================================================
log "Esperando a que PostgreSQL arranque..."
sleep 10

# Crear schema y extensiones necesarias
docker compose exec -T db psql -U nexo -d "nexo_${CLIENT_NAME}" -c "
  CREATE SCHEMA IF NOT EXISTS app;
  CREATE EXTENSION IF NOT EXISTS vector;
  CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
" 2>/dev/null && ok "Schema y extensiones creadas" || log "Schema posiblemente ya existente"

# Ejecutar migraciones Prisma
if [ -f backend/prisma/schema.prisma ]; then
    docker compose exec -T backend npx prisma db push --accept-data-loss 2>/dev/null \
        && ok "Prisma push completado" \
        || log "Prisma push pendiente (backend puede no estar listo aún)"
fi

# =============================================================================
step "Crear registro DNS en Cloudflare"
# =============================================================================
VPS_IP=$(curl -s https://api.ipify.org || curl -s https://ifconfig.me)
log "IP pública del VPS: $VPS_IP"

# Buscar si ya existe un registro A para este dominio
EXISTING_RECORD=$(curl -s -X GET "$CF_API/zones/$CF_ZONE_ID/dns_records?type=A&name=$DOMAIN" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" | jq -r '.result[0].id // empty')

if [ -n "$EXISTING_RECORD" ]; then
    log "Registro DNS ya existe (ID: $EXISTING_RECORD). Actualizando IP..."
    CF_RESULT=$(curl -s -X PUT "$CF_API/zones/$CF_ZONE_ID/dns_records/$EXISTING_RECORD" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"type":"A","name":"'"$DOMAIN"'","content":"'"$VPS_IP"'","ttl":1,"proxied":false}')
    if echo "$CF_RESULT" | jq -r '.success' | grep -q true; then
        ok "DNS actualizado: $DOMAIN → $VPS_IP"
    else
        log "⚠️  Error actualizando DNS: $(echo $CF_RESULT | jq -r '.errors[0].message // "unknown"')"
    fi
else
    log "Creando registro A: $DOMAIN → $VPS_IP"
    CF_RESULT=$(curl -s -X POST "$CF_API/zones/$CF_ZONE_ID/dns_records" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"type":"A","name":"'"$DOMAIN"'","content":"'"$VPS_IP"'","ttl":1,"proxied":false}')
    if echo "$CF_RESULT" | jq -r '.success' | grep -q true; then
        ok "DNS creado: $DOMAIN → $VPS_IP"
    else
        log "⚠️  Error creando DNS: $(echo $CF_RESULT | jq -r '.errors[0].message // "unknown"')"
    fi
fi

# Verificar propagación DNS (hasta 5 min)
DNS_OK=false
for i in $(seq 1 30); do
    RESOLVED=$(dig +short "$DOMAIN" 2>/dev/null || host "$DOMAIN" 2>/dev/null | awk '/has address/ {print $4}')
    if [ "$RESOLVED" = "$VPS_IP" ]; then
        ok "DNS verificado: $DOMAIN → $RESOLVED"
        DNS_OK=true
        break
    fi
    log "Esperando DNS... intento $i/30 (resuelve a: ${RESOLVED:-nada})"
    sleep 10
done

if [ "$DNS_OK" = false ]; then
    log "⚠️  DNS no propagó en 5 min. SSL se intentará igualmente."
fi

# =============================================================================
step "Configurar Nginx reverse proxy"
# =============================================================================
NGINX_CONF="/etc/nginx/sites-available/$CLIENT_NAME"
NGINX_ENABLED="/etc/nginx/sites-enabled/$CLIENT_NAME"

if [ -f "$NGINX_CONF" ]; then
    log "Configuración Nginx ya existe para $CLIENT_NAME"
else
    # Leer puertos del .env generado
    NGX_BACKEND=$(grep PORT_BACKEND "$INSTANCE_DIR/.env" | cut -d= -f2)
    NGX_FRONTEND=$(grep PORT_FRONTEND "$INSTANCE_DIR/.env" | cut -d= -f2)
    NGX_N8N=$(grep PORT_N8N "$INSTANCE_DIR/.env" | cut -d= -f2)

    sudo tee "$NGINX_CONF" > /dev/null << NGINX
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:${NGX_FRONTEND};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:${NGX_BACKEND}/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # n8n
    location /n8n/ {
        proxy_pass http://127.0.0.1:${NGX_N8N}/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://127.0.0.1:${NGX_BACKEND}/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
NGINX

    sudo ln -sf "$NGINX_CONF" "$NGINX_ENABLED"
    sudo nginx -t && sudo systemctl reload nginx
    ok "Nginx configurado para $DOMAIN"
fi

# =============================================================================
step "Obtener certificado SSL"
# =============================================================================
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    ok "Certificado SSL ya existe para $DOMAIN"
else
    log "Solicitando certificado SSL con Certbot..."
    sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@strategialaboratory.com \
        && ok "Certificado SSL obtenido" \
        || log "⚠️  SSL falló — verifica que el DNS apunte a este servidor"
fi

# =============================================================================
# Resumen final
# =============================================================================
echo ""
echo "========================================="
echo "  NEXO CORE — Despliegue completado"
echo "========================================="
echo ""
echo "  Cliente:    $CLIENT_NAME"
echo "  Dominio:    $DOMAIN"
echo "  Directorio: $INSTANCE_DIR"
echo ""
echo "  Contenedores:"
docker compose -p "nexo-${CLIENT_NAME}" ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || true
echo ""
echo "  URLs:"
echo "    Frontend:  https://$DOMAIN"
echo "    Backend:   https://$DOMAIN/api"
echo "    n8n:       https://$DOMAIN/n8n"
echo ""
echo "  Credenciales n8n:"
echo "    User:      admin"
echo "    Pass:      (ver .env → N8N_BASIC_AUTH_PASSWORD)"
echo ""
echo "========================================="
echo "  ¡Instancia lista!"
echo "========================================="
