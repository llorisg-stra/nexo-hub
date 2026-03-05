#!/bin/bash
# =============================================================================
# Nexo Hub — Provision VPS (Orchestrator)
# Ejecuta TODO el pipeline completo para preparar un VPS nuevo:
#   1. Ejecuta setup-vps.sh en el VPS (Docker, Node, Nginx, WireGuard, etc.)
#   2. Registra el peer WireGuard en el servidor dedicado
#   3. Verifica conectividad VPN
#
# Uso (desde local, PowerShell):
#   bash scripts/provision-vps.sh <SSH_ALIAS> <VPN_IP>
#
# Ejemplo:
#   bash scripts/provision-vps.sh nexo-core-1 10.0.0.4
#
# Este script se ejecuta EN LOCAL, no en el VPS.
# =============================================================================

set -euo pipefail

# --- Parámetros ---
VPS_HOST="${1:?ERROR: Falta SSH_ALIAS (ej: nexo-core-1)}"
VPN_IP="${2:?ERROR: Falta VPN_IP (ej: 10.0.0.4)}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[ORCHESTRATOR]${NC} $1"; }
ok()  { echo -e "${GREEN}[✅]${NC} $1"; }
err() { echo -e "${RED}[❌]${NC} $1"; exit 1; }

echo ""
echo "========================================="
echo "  NEXO — Provisioning VPS"
echo "========================================="
echo "  Host:     $VPS_HOST"
echo "  VPN IP:   $VPN_IP"
echo "========================================="
echo ""

# =============================================================================
# PASO 1: Ejecutar setup-vps.sh en el VPS
# =============================================================================
log "Paso 1/3: Ejecutando setup-vps.sh en $VPS_HOST..."

# Convertir CRLF a LF y enviar al VPS
cat "$SCRIPT_DIR/setup-vps.sh" | tr -d '\r' | ssh "$VPS_HOST" "bash -s -- $VPN_IP"

ok "Setup completado en $VPS_HOST"

# =============================================================================
# PASO 2: Leer la public key y registrar en el servidor dedicado
# =============================================================================
log "Paso 2/3: Registrando peer WireGuard en el servidor dedicado..."

# Leer la public key del VPS
WG_PUBKEY=$(ssh "$VPS_HOST" "cat ~/wg_public_key.txt 2>/dev/null" | tr -d '\r\n ')

if [ -z "$WG_PUBKEY" ]; then
    err "No se pudo leer la public key de WireGuard del VPS"
fi

log "Public key: $WG_PUBKEY"

# Registrar el peer en el servidor dedicado (via ProxyJump nexo-hub → VPN)
ssh nexo-ocr "sudo wg set wg0 peer '$WG_PUBKEY' allowed-ips '$VPN_IP/32' persistent-keepalive 25 && sudo wg-quick save wg0 && echo PEER_REGISTERED"

ok "Peer $VPN_IP registrado en el servidor dedicado"

# =============================================================================
# PASO 3: Verificar conectividad VPN
# =============================================================================
log "Paso 3/3: Verificando conectividad VPN..."

sleep 5

# Verificar que el VPS puede hacer ping al servidor dedicado
VPN_TEST=$(ssh "$VPS_HOST" "ping -c 2 -W 5 10.0.0.1 2>/dev/null && echo VPN_OK || echo VPN_FAIL")

if echo "$VPN_TEST" | grep -q "VPN_OK"; then
    ok "VPN verificada: $VPS_HOST ($VPN_IP) → Dedicado (10.0.0.1)"
else
    log "⚠️  VPN no responde aún. Puede tardar unos segundos más."
    log "Prueba manualmente: ssh $VPS_HOST \"ping 10.0.0.1\""
fi

# =============================================================================
# Resumen
# =============================================================================
echo ""
echo "========================================="
echo "  NEXO — VPS Provisionado"
echo "========================================="
echo ""
echo "  Host:      $VPS_HOST"
echo "  VPN IP:    $VPN_IP"
echo "  WG Key:    ${WG_PUBKEY:0:20}..."
echo ""
echo "  Software:  Docker, Node 22, PM2, Nginx, Certbot, WireGuard"
echo "  Firewall:  UFW (22, 80, 443, 51820/udp)"
echo "  VPN:       Conectado a RAG server (10.0.0.1)"
echo ""
echo "  Siguiente paso:"
echo "    deploy-nexo-core.sh <CLIENT_NAME> <DOMAIN>"
echo ""
echo "========================================="
echo "  ¡VPS listo!"
echo "========================================="
