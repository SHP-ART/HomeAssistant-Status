#!/bin/bash

# Home Assistant Status Dashboard - Server Installation Script
# Dieses Script wird AUF DEM SERVER ausgeführt und richtet alles ein

set -e  # Bei Fehler abbrechen

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║  Home Assistant Status Dashboard - Server Installation   ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Prüfen ob wir im richtigen Verzeichnis sind
if [ ! -f "package.json" ]; then
    echo -e "${RED}Fehler: package.json nicht gefunden!${NC}"
    echo "Bitte führe dieses Script im Projekt-Verzeichnis aus."
    exit 1
fi

# Funktion: Eingabe mit Default-Wert
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"

    read -p "$(echo -e ${YELLOW}${prompt}${NC}) [${default}]: " input
    eval $var_name="${input:-$default}"
}

# 1. Konfiguration
echo -e "${BLUE}=== Schritt 1: Konfiguration ===${NC}\n"

prompt_with_default "Port für die Anwendung" "3000" PORT
prompt_with_default "PM2 App Name" "ha-status" PM2_APP_NAME
prompt_with_default "Node Environment" "production" NODE_ENV

echo ""
echo -e "${GREEN}Konfiguration:${NC}"
echo "  Port: ${PORT}"
echo "  PM2 App Name: ${PM2_APP_NAME}"
echo "  Environment: ${NODE_ENV}"
echo ""

read -p "$(echo -e ${YELLOW}Ist die Konfiguration korrekt?${NC}) (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Installation abgebrochen${NC}"
    exit 1
fi

# 2. System-Abhängigkeiten prüfen
echo ""
echo -e "${BLUE}=== Schritt 2: System-Abhängigkeiten prüfen ===${NC}"

# Node.js prüfen
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js ist nicht installiert${NC}"
    echo "Installiere Node.js..."

    if command -v apt-get &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
        sudo yum install -y nodejs
    else
        echo -e "${RED}Konnte Node.js nicht automatisch installieren.${NC}"
        echo "Bitte installiere Node.js manuell: https://nodejs.org/"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Node.js $(node -v) installiert${NC}"
fi

# npm prüfen
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm ist nicht installiert${NC}"
    exit 1
else
    echo -e "${GREEN}✓ npm $(npm -v) installiert${NC}"
fi

# PM2 prüfen/installieren
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠ PM2 ist nicht installiert${NC}"
    echo "Installiere PM2 global..."
    sudo npm install -g pm2
    echo -e "${GREEN}✓ PM2 installiert${NC}"
else
    echo -e "${GREEN}✓ PM2 $(pm2 -v) installiert${NC}"
fi

# 3. Dependencies installieren
echo ""
echo -e "${BLUE}=== Schritt 3: Projekt Dependencies installieren ===${NC}"

if [ -d "node_modules" ]; then
    echo "node_modules existiert bereits. Lösche und installiere neu..."
    rm -rf node_modules
fi

npm install
echo -e "${GREEN}✓ Dependencies installiert${NC}"

# 4. Production Build erstellen
echo ""
echo -e "${BLUE}=== Schritt 4: Production Build erstellen ===${NC}"

if [ -d "dist" ]; then
    echo "Lösche alten Build..."
    rm -rf dist
fi

npm run build
echo -e "${GREEN}✓ Build erfolgreich erstellt${NC}"

# 5. Nginx installieren und konfigurieren
echo ""
echo -e "${BLUE}=== Schritt 5: Nginx Setup ===${NC}"

if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}⚠ Nginx ist nicht installiert${NC}"
    read -p "Nginx installieren? (empfohlen) (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y nginx
        elif command -v yum &> /dev/null; then
            sudo yum install -y nginx
        fi
        echo -e "${GREEN}✓ Nginx installiert${NC}"
    fi
fi

# Nginx Config erstellen
if command -v nginx &> /dev/null; then
    NGINX_CONF="/etc/nginx/sites-available/${PM2_APP_NAME}"

    echo "Erstelle Nginx Konfiguration..."
    sudo tee $NGINX_CONF > /dev/null << EOF
server {
    listen 80;
    server_name _;

    root $(pwd)/dist;
    index index.html;

    # Gzip Kompression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Admin-Bereich NUR aus lokalem Netzwerk
    location /admin {
        # WICHTIG: Passe die IP-Range an dein Netzwerk an!
        # allow 192.168.1.0/24;    # Beispiel für 192.168.1.x
        # allow 10.0.0.0/24;       # Beispiel für 10.0.0.x
        # deny all;

        try_files \$uri \$uri/ /index.html;
    }

    # Statische Dateien
    location / {
        try_files \$uri \$uri/ /index.html;

        # Cache für Assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

    # Symlink erstellen
    if [ -d "/etc/nginx/sites-enabled" ]; then
        sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/${PM2_APP_NAME}

        # Default site deaktivieren
        if [ -L "/etc/nginx/sites-enabled/default" ]; then
            sudo rm /etc/nginx/sites-enabled/default
        fi
    fi

    # Nginx testen und neu laden
    sudo nginx -t && sudo systemctl reload nginx

    echo -e "${GREEN}✓ Nginx konfiguriert und neu geladen${NC}"
    NGINX_PORT=80
else
    echo -e "${YELLOW}⚠ Nginx wurde übersprungen${NC}"
    NGINX_PORT="nicht verfügbar"
fi

# 6. PM2 Konfiguration erstellen
echo ""
echo -e "${BLUE}=== Schritt 6: PM2 Setup ===${NC}"

# PM2 Ecosystem Config erstellen
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '${PM2_APP_NAME}',
    script: 'npx',
    args: 'serve dist -l ${PORT}',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: '${NODE_ENV}',
      PORT: ${PORT}
    }
  }]
};
EOF

echo -e "${GREEN}✓ PM2 Konfiguration erstellt (ecosystem.config.js)${NC}"

# 7. PM2 App starten
echo ""
echo -e "${BLUE}=== Schritt 7: PM2 App starten ===${NC}"

# Prüfen ob App bereits läuft
if pm2 describe ${PM2_APP_NAME} &> /dev/null; then
    echo "App läuft bereits, starte neu..."
    pm2 restart ${PM2_APP_NAME}
else
    echo "Starte App zum ersten Mal..."
    pm2 start ecosystem.config.js
fi

# PM2 Startup Script einrichten
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME > /dev/null 2>&1 || true

echo -e "${GREEN}✓ PM2 App gestartet${NC}"

# 8. Firewall konfigurieren (optional)
echo ""
echo -e "${BLUE}=== Schritt 8: Firewall (optional) ===${NC}"

if command -v ufw &> /dev/null; then
    read -p "Firewall (UFW) konfigurieren? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo ufw allow 80/tcp comment 'Nginx HTTP'
        sudo ufw allow 443/tcp comment 'Nginx HTTPS'
        sudo ufw allow ${PORT}/tcp comment 'HA Status Dashboard'
        echo -e "${GREEN}✓ Firewall Regeln hinzugefügt${NC}"
    fi
else
    echo -e "${YELLOW}⚠ UFW nicht gefunden, übersprungen${NC}"
fi

# 9. Status anzeigen
echo ""
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║            Installation erfolgreich abgeschlossen!        ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Server IP ermitteln
SERVER_IP=$(hostname -I | awk '{print $1}')

echo -e "${BLUE}=== Zugriffs-Informationen ===${NC}\n"
echo -e "${GREEN}PM2 App:${NC}"
echo "  Name: ${PM2_APP_NAME}"
echo "  Port: ${PORT}"
echo "  URL: http://${SERVER_IP}:${PORT}"
echo ""

if [ "$NGINX_PORT" != "nicht verfügbar" ]; then
    echo -e "${GREEN}Nginx (empfohlen):${NC}"
    echo "  Port: ${NGINX_PORT}"
    echo "  URL: http://${SERVER_IP}"
    echo "  Admin: http://${SERVER_IP}/admin (nur lokal)"
    echo ""
fi

echo -e "${BLUE}=== Nützliche Befehle ===${NC}\n"
echo -e "${YELLOW}PM2 Status anzeigen:${NC}"
echo "  pm2 status"
echo "  pm2 logs ${PM2_APP_NAME}"
echo "  pm2 monit"
echo ""
echo -e "${YELLOW}PM2 Neustart:${NC}"
echo "  pm2 restart ${PM2_APP_NAME}"
echo ""
echo -e "${YELLOW}PM2 Stoppen:${NC}"
echo "  pm2 stop ${PM2_APP_NAME}"
echo ""
echo -e "${YELLOW}Nginx Status:${NC}"
echo "  sudo systemctl status nginx"
echo "  sudo nginx -t"
echo "  sudo systemctl reload nginx"
echo ""
echo -e "${YELLOW}Updates einspielen:${NC}"
echo "  git pull"
echo "  ./update.sh"
echo ""

echo -e "${BLUE}=== Nächste Schritte ===${NC}\n"
echo "1. Öffne im Browser: http://${SERVER_IP}/admin"
echo "   (Nur aus dem lokalen Netzwerk erreichbar!)"
echo ""
echo "2. Konfiguriere Home Assistant Verbindung"
echo ""
echo "3. Erstelle Dashboard Kacheln"
echo ""
echo "4. Öffentliches Dashboard: http://${SERVER_IP}"
echo ""
echo "5. Für Internet-Zugriff siehe: NGINX_PROXY_MANAGER_SETUP.md"
echo ""

# Konfiguration speichern
cat > .install-config << EOF
# Server Installation Configuration
# Erstellt am: $(date)
PM2_APP_NAME="${PM2_APP_NAME}"
PORT=${PORT}
NODE_ENV="${NODE_ENV}"
SERVER_IP="${SERVER_IP}"
NGINX_INSTALLED=$(command -v nginx &> /dev/null && echo "true" || echo "false")
EOF

echo -e "${GREEN}✓ Konfiguration gespeichert in: .install-config${NC}"
echo ""

# PM2 Status anzeigen
pm2 status
