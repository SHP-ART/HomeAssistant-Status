#!/bin/bash

# Home Assistant Status Dashboard - Update Script
# Dieses Script wird AUF DEM SERVER ausgeführt und aktualisiert die App

set -e  # Bei Fehler abbrechen

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Home Assistant Status Dashboard Update ===${NC}"
echo ""

# Prüfen ob wir im richtigen Verzeichnis sind
if [ ! -f "package.json" ]; then
    echo -e "${RED}Fehler: package.json nicht gefunden!${NC}"
    echo "Bitte führe dieses Script im Projekt-Verzeichnis aus."
    exit 1
fi

# Konfiguration laden
if [ -f ".install-config" ]; then
    source .install-config
    echo -e "${GREEN}✓ Konfiguration geladen${NC}"
else
    echo -e "${YELLOW}⚠ Keine .install-config gefunden, verwende Defaults${NC}"
    PM2_APP_NAME="ha-status"
    PORT=3000
fi

# 1. Git Status prüfen (optional)
echo -e "${YELLOW}[1/7] Prüfe Git Status...${NC}"
if command -v git &> /dev/null && [ -d ".git" ]; then
    if [[ -n $(git status -s) ]]; then
        echo -e "${RED}Warnung: Es gibt uncommitted changes!${NC}"
        git status -s
        read -p "Trotzdem fortfahren? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    # Git Pull
    echo "Hole neueste Änderungen..."
    git pull || echo -e "${YELLOW}Git pull fehlgeschlagen, fahre trotzdem fort...${NC}"
else
    echo -e "${YELLOW}Git nicht gefunden oder kein Repository, übersprungen${NC}"
fi

# 2. PM2 App stoppen
echo -e "${YELLOW}[2/7] Stoppe PM2 App...${NC}"
if pm2 describe ${PM2_APP_NAME} &> /dev/null; then
    pm2 stop ${PM2_APP_NAME}
    echo -e "${GREEN}✓ App gestoppt${NC}"
else
    echo -e "${YELLOW}⚠ App läuft nicht${NC}"
fi

# 3. Backup erstellen
echo -e "${YELLOW}[3/7] Erstelle Backup...${NC}"
BACKUP_DIR="backups"
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"

mkdir -p ${BACKUP_DIR}

if [ -d "dist" ]; then
    cp -r dist ${BACKUP_DIR}/${BACKUP_NAME}
    echo -e "${GREEN}✓ Backup erstellt: ${BACKUP_DIR}/${BACKUP_NAME}${NC}"

    # Alte Backups löschen (älter als 7 Tage)
    find ${BACKUP_DIR} -maxdepth 1 -name "backup-*" -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true
    echo "Alte Backups (>7 Tage) gelöscht"
fi

# 4. Dependencies aktualisieren
echo -e "${YELLOW}[4/7] Aktualisiere Dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies aktualisiert${NC}"

# 5. Linting (optional)
echo -e "${YELLOW}[5/7] Führe Linting aus (optional)...${NC}"
npm run lint || {
    echo -e "${YELLOW}⚠ Linting Fehler gefunden!${NC}"
    read -p "Trotzdem fortfahren? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        # Restore backup
        if [ -d "${BACKUP_DIR}/${BACKUP_NAME}" ]; then
            rm -rf dist
            cp -r ${BACKUP_DIR}/${BACKUP_NAME} dist
            pm2 start ${PM2_APP_NAME}
        fi
        exit 1
    fi
}

# 6. Production Build erstellen
echo -e "${YELLOW}[6/7] Erstelle Production Build...${NC}"

# Alten Build löschen
if [ -d "dist" ]; then
    rm -rf dist
fi

# Neuen Build erstellen
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}✗ Build fehlgeschlagen!${NC}"

    # Restore backup
    if [ -d "${BACKUP_DIR}/${BACKUP_NAME}" ]; then
        echo "Stelle Backup wieder her..."
        cp -r ${BACKUP_DIR}/${BACKUP_NAME} dist
    fi

    pm2 start ${PM2_APP_NAME}
    exit 1
fi

echo -e "${GREEN}✓ Build erfolgreich erstellt${NC}"

# 7. PM2 App neu starten
echo -e "${YELLOW}[7/7] Starte PM2 App neu...${NC}"

if pm2 describe ${PM2_APP_NAME} &> /dev/null; then
    pm2 restart ${PM2_APP_NAME}
else
    # Prüfe ob ecosystem.config.js existiert
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js
    else
        # Fallback: Erstelle temporäre Konfiguration
        pm2 start "npx serve dist -l ${PORT}" --name ${PM2_APP_NAME}
    fi
fi

pm2 save

echo -e "${GREEN}✓ App wurde neu gestartet${NC}"

# Nginx neu laden (falls vorhanden)
if command -v nginx &> /dev/null; then
    echo ""
    echo -e "${BLUE}Nginx neu laden...${NC}"
    sudo nginx -t && sudo systemctl reload nginx && echo -e "${GREEN}✓ Nginx neu geladen${NC}" || echo -e "${YELLOW}⚠ Nginx reload fehlgeschlagen${NC}"
fi

# Status anzeigen
echo ""
echo -e "${GREEN}=== Update erfolgreich abgeschlossen! ===${NC}"
echo ""

# Server IP ermitteln
SERVER_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")

echo -e "${BLUE}=== Status ===${NC}\n"
echo -e "${GREEN}PM2 App:${NC}"
echo "  Name: ${PM2_APP_NAME}"
echo "  Port: ${PORT}"
echo "  URL: http://${SERVER_IP}:${PORT}"
echo ""

if command -v nginx &> /dev/null; then
    echo -e "${GREEN}Nginx:${NC}"
    echo "  URL: http://${SERVER_IP}"
    echo "  Admin: http://${SERVER_IP}/admin"
    echo ""
fi

echo -e "${BLUE}PM2 Status:${NC}"
pm2 status

echo ""
echo -e "${YELLOW}Logs anzeigen:${NC} pm2 logs ${PM2_APP_NAME}"
echo -e "${YELLOW}App Monitor:${NC} pm2 monit"
echo ""
