#!/bin/bash
# =============================================================================
# HYC Contract Hub — VPS Setup Script para Hostinger Ubuntu 22.04
# Ejecutar como root: bash setup.sh
# =============================================================================

set -e

AGENT_DIR="/opt/hermes-agent"
AGENT_USER="hermes"
NODE_VERSION="20"

echo "==> [1/8] Actualizando sistema..."
apt-get update -y && apt-get upgrade -y

echo "==> [2/8] Instalando dependencias base..."
apt-get install -y \
  curl wget git unzip \
  build-essential \
  nginx certbot python3-certbot-nginx \
  ufw fail2ban \
  htop ncdu

echo "==> [3/8] Instalando Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y nodejs
node --version && npm --version

echo "==> [4/8] Instalando Docker..."
curl -fsSL https://get.docker.com | bash -
systemctl enable docker && systemctl start docker
docker --version

echo "==> [5/8] Configurando firewall (UFW)..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 3000  # Hermes Agent webhook port
echo "y" | ufw enable

echo "==> [6/8] Creando usuario $AGENT_USER..."
if ! id "$AGENT_USER" &>/dev/null; then
  useradd -r -s /bin/bash -d "$AGENT_DIR" -m "$AGENT_USER"
fi
usermod -aG docker "$AGENT_USER"

echo "==> [7/8] Clonando repositorio del agente..."
if [ -d "$AGENT_DIR/.git" ]; then
  echo "   Repositorio ya existe, actualizando..."
  cd "$AGENT_DIR" && git pull origin claude/hermes-agent-vps-setup-XU4wa
else
  git clone -b claude/hermes-agent-vps-setup-XU4wa \
    https://github.com/carlosriveros-ui/hyc-contract-hub.git /tmp/repo
  cp -r /tmp/repo/vps/hermes-agent/* "$AGENT_DIR/"
  rm -rf /tmp/repo
fi

chown -R "$AGENT_USER":"$AGENT_USER" "$AGENT_DIR"
cd "$AGENT_DIR" && npm install

echo "==> [8/8] Instalando servicio systemd..."
cat > /etc/systemd/system/hermes-agent.service <<EOF
[Unit]
Description=Hermes Agent - HYC Contract Hub AI Agent
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=$AGENT_USER
WorkingDirectory=$AGENT_DIR
ExecStart=/usr/bin/node $AGENT_DIR/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=hermes-agent
EnvironmentFile=$AGENT_DIR/.env

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable hermes-agent

echo ""
echo "=============================================="
echo " Setup completado. Proximos pasos:"
echo ""
echo " 1. Copia tu .env al servidor:"
echo "    scp .env.example root@TU_IP_VPS:$AGENT_DIR/.env"
echo "    nano $AGENT_DIR/.env   # edita con tus keys reales"
echo ""
echo " 2. Inicia el agente:"
echo "    systemctl start hermes-agent"
echo "    systemctl status hermes-agent"
echo ""
echo " 3. Ver logs en tiempo real:"
echo "    journalctl -u hermes-agent -f"
echo "=============================================="
