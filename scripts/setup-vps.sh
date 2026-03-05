#!/bin/bash
# =============================================================================
# Nexo Hub — VPS Base Setup Script
# Prepara un VPS Ubuntu 24.04 limpio para recibir instancias de nexo-core
# 
# Uso: 
#   Get-Content scripts/setup-vps.sh | ssh nexo-core-X "bash -s -- 10.0.0.6"
#
# El parámetro es la IP VPN a asignar (10.0.0.x)
# =============================================================================

set -euo pipefail

# --- Parámetro: IP VPN ---
VPN_IP="${1:-}"
if [ -z "$VPN_IP" ]; then
    echo "⚠️  Sin IP VPN. WireGuard NO se configurará."
    echo "   Para configurar VPN, pasa la IP: bash -s -- 10.0.0.X"
    SKIP_WG=true
else
    SKIP_WG=false
    echo "VPN IP asignada: $VPN_IP"
fi

# --- Configuración WireGuard (RAG Server) ---
WG_SERVER_PUBKEY="N5WuUFJold9FkJjemfMK5wfJvHc/sNvnlOYZWWxOnAY="
WG_SERVER_ENDPOINT="147.135.215.195:51820"
WG_SERVER_VPN_IP="10.0.0.1/32"

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[NEXO]${NC} $1"; }
ok()  { echo -e "${GREEN}[✅]${NC} $1"; }
err() { echo -e "${RED}[❌]${NC} $1"; }

TOTAL_STEPS=11
STEP=0
step() { STEP=$((STEP+1)); echo ""; log "=== Step $STEP/$TOTAL_STEPS: $1 ==="; }

# =============================================================================
step "Actualizar sistema"
# =============================================================================
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update -qq
sudo apt-get upgrade -y -qq
ok "Sistema actualizado"

# =============================================================================
step "Instalar Docker + Docker Compose"
# =============================================================================
if command -v docker &> /dev/null; then
    ok "Docker ya instalado: $(docker --version)"
else
    log "Instalando Docker..."
    sudo apt-get install -y -qq ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -qq
    sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    ok "Docker instalado: $(docker --version)"
fi

# Añadir usuario al grupo docker
if groups $USER | grep -q docker; then
    ok "Usuario '$USER' ya en grupo docker"
else
    sudo usermod -aG docker $USER
    ok "Usuario '$USER' añadido al grupo docker"
fi

# =============================================================================
step "Instalar Node.js 22 LTS"
# =============================================================================
if command -v node &> /dev/null; then
    ok "Node.js ya instalado: $(node --version)"
else
    log "Instalando Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y -qq nodejs
    ok "Node.js instalado: $(node --version)"
fi

# =============================================================================
step "Instalar PM2"
# =============================================================================
if command -v pm2 &> /dev/null; then
    ok "PM2 ya instalado: v$(pm2 --version)"
else
    log "Instalando PM2..."
    sudo npm install -g pm2
    ok "PM2 instalado: v$(pm2 --version)"
fi

# =============================================================================
step "Instalar Nginx"
# =============================================================================
if command -v nginx &> /dev/null; then
    ok "Nginx ya instalado: $(nginx -v 2>&1)"
else
    log "Instalando Nginx..."
    sudo apt-get install -y -qq nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    ok "Nginx instalado: $(nginx -v 2>&1)"
fi

# Desactivar sitio por defecto
if [ -L /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default
    sudo systemctl reload nginx
    log "Sitio default de Nginx desactivado"
fi

# =============================================================================
step "Instalar Certbot (SSL)"
# =============================================================================
if command -v certbot &> /dev/null; then
    ok "Certbot ya instalado: $(certbot --version 2>&1)"
else
    log "Instalando Certbot..."
    sudo apt-get install -y -qq certbot python3-certbot-nginx
    ok "Certbot instalado: $(certbot --version 2>&1)"
fi

# =============================================================================
step "Instalar utilidades"
# =============================================================================
sudo apt-get install -y -qq curl wget htop unzip jq
ok "Utilidades instaladas (curl, wget, htop, unzip, jq)"

# =============================================================================
step "Configurar firewall (UFW)"
# =============================================================================
if sudo ufw status | grep -q "active"; then
    ok "UFW ya activo"
else
    log "Configurando UFW..."
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow 22/tcp      # SSH
    sudo ufw allow 80/tcp      # HTTP
    sudo ufw allow 443/tcp     # HTTPS
    sudo ufw allow 51820/udp   # WireGuard
    sudo ufw --force enable
    ok "UFW configurado y activo (22, 80, 443)"
fi

# =============================================================================
step "Crear estructura de directorios"
# =============================================================================
mkdir -p ~/instances
mkdir -p ~/backups
ok "Estructura creada: ~/instances/ y ~/backups/"

# =============================================================================
step "Configurar WireGuard VPN"
# =============================================================================
if [ "$SKIP_WG" = true ]; then
    log "Saltando WireGuard (no se proporcionó IP VPN)"
else
    if command -v wg &> /dev/null && [ -f /etc/wireguard/wg0.conf ]; then
        ok "WireGuard ya configurado"
    else
        log "Instalando WireGuard..."
        sudo apt-get install -y -qq wireguard

        # Generar keypair
        WG_PRIVATE=$(wg genkey)
        WG_PUBLIC=$(echo "$WG_PRIVATE" | wg pubkey)

        # Crear configuración
        sudo bash -c "cat > /etc/wireguard/wg0.conf << EOF
[Interface]
PrivateKey = $WG_PRIVATE
Address = $VPN_IP/24

# Dedicated Server (RAG/OCR)
[Peer]
PublicKey = $WG_SERVER_PUBKEY
AllowedIPs = $WG_SERVER_VPN_IP
Endpoint = $WG_SERVER_ENDPOINT
PersistentKeepalive = 25
EOF"
        sudo chmod 600 /etc/wireguard/wg0.conf

        # Activar y arrancar
        sudo systemctl enable wg-quick@wg0
        sudo systemctl start wg-quick@wg0

        ok "WireGuard configurado: $VPN_IP"

        # Guardar public key para que el orquestador pueda leerlo
        echo "$WG_PUBLIC" > ~/wg_public_key.txt
        log "Public key guardada en ~/wg_public_key.txt"
        echo "WG_PUBKEY=$WG_PUBLIC"
    fi
fi

# =============================================================================
step "Verificación final"
# =============================================================================
echo ""
echo "========================================="
echo "  NEXO VPS — Setup Completo"
echo "========================================="
echo ""
echo "  Docker:   $(docker --version 2>/dev/null || echo 'NO')"
echo "  Compose:  $(docker compose version 2>/dev/null || echo 'NO')"
echo "  Node.js:  $(node --version 2>/dev/null || echo 'NO')"
echo "  npm:      $(npm --version 2>/dev/null || echo 'NO')"
echo "  PM2:      v$(pm2 --version 2>/dev/null || echo 'NO')"
echo "  Nginx:    $(nginx -v 2>&1 || echo 'NO')"
echo "  Certbot:  $(certbot --version 2>&1 || echo 'NO')"
echo "  Git:      $(git --version 2>/dev/null || echo 'NO')"
echo "  UFW:      $(sudo ufw status | head -1)"
echo "  Docker GRP: $(groups $USER | grep -o docker || echo 'NO')"
if [ "$SKIP_WG" = false ]; then
echo "  WireGuard: $(sudo wg show wg0 2>/dev/null | grep 'interface' && echo 'OK - '$VPN_IP || echo 'NO')"
fi
echo ""
echo "  Disco:    $(df -h / | tail -1 | awk '{print $4 " libre de " $2}')"
echo "  RAM:      $(free -h | grep Mem | awk '{print $7 " libre de " $2}')"
echo ""
echo "  Directorio instancias: ~/instances/"
echo ""
echo "========================================="
echo "  VPS listo para recibir matrices Nexo"
echo "========================================="
