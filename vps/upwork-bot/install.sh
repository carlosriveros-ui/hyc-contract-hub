#!/bin/bash
# Instala el Upwork Bot en el VPS
set -e

BOT_DIR="/opt/upwork-bot"
echo "==> Instalando Upwork Bot en $BOT_DIR..."

# Python 3 y pip
apt-get install -y python3 python3-pip python3-venv

# Crear directorio
mkdir -p "$BOT_DIR"

# Copiar archivos del repo
REPO_DIR=$(dirname "$(readlink -f "$0")")
cp "$REPO_DIR"/*.py "$BOT_DIR/"
cp "$REPO_DIR/requirements.txt" "$BOT_DIR/"
cp "$REPO_DIR/.env.example" "$BOT_DIR/.env.example"

# Crear y activar entorno virtual
python3 -m venv "$BOT_DIR/venv"
"$BOT_DIR/venv/bin/pip" install --upgrade pip
"$BOT_DIR/venv/bin/pip" install -r "$BOT_DIR/requirements.txt"

# Instalar Chromium para Playwright
"$BOT_DIR/venv/bin/playwright" install chromium
"$BOT_DIR/venv/bin/playwright" install-deps chromium

# Servicio systemd
cat > /etc/systemd/system/upwork-bot.service <<EOF
[Unit]
Description=Upwork Bot — HYC Proyectos
After=network.target hermes-agent.service

[Service]
Type=simple
User=root
WorkingDirectory=$BOT_DIR
ExecStart=$BOT_DIR/venv/bin/python main.py
Restart=always
RestartSec=30
StandardOutput=journal
StandardError=journal
SyslogIdentifier=upwork-bot
EnvironmentFile=$BOT_DIR/.env

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable upwork-bot

echo ""
echo "=============================================="
echo " Upwork Bot instalado!"
echo ""
echo " 1. Configura tus credenciales:"
echo "    nano $BOT_DIR/.env"
echo ""
echo " 2. Inicia el bot:"
echo "    systemctl start upwork-bot"
echo "    systemctl status upwork-bot"
echo ""
echo " 3. Ver logs:"
echo "    journalctl -u upwork-bot -f"
echo "=============================================="
