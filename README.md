# Home Assistant Statusseite

Eine moderne, React-basierte Statusseite für Home Assistant, die Gerätestatus, System-Metriken und historische Daten in einem übersichtlichen Dashboard anzeigt.

![Home Assistant Status Dashboard](screenshot.png)

## Features

- **Gerätestatus**: Überwachen Sie den Status Ihrer Lichter, Schalter, Sensoren und anderen Geräte in Echtzeit
- **System-Metriken**: Zeigt CPU-, RAM- und Festplattenauslastung sowie Uptime an
- **Historische Daten**: Visualisierung von Sensordaten der letzten 24 Stunden mit interaktiven Charts
- **Echtzeit-Updates**: Automatische Aktualisierung der Daten alle 5-10 Sekunden
- **Responsive Design**: Optimiert für Desktop und Mobile
- **Dark Mode**: Modernes dunkles Design mit ansprechenden Farbverläufen
- **Sichere Konfiguration**: Zugangsdaten werden nur lokal im Browser gespeichert (Local Storage)

## ⚠️ Sicherheitshinweise

**WICHTIG:** Diese App speichert keine sensiblen Daten auf GitHub!

- ✅ Home Assistant URL und Token werden **NUR** im Browser Local Storage gespeichert
- ✅ Die `.gitignore` Datei verhindert das Hochladen von `.env` Dateien
- ✅ Keine Hardcoded Credentials im Code
- ⚠️ Lösche niemals die `.gitignore` Datei
- ⚠️ Committe niemals `.env` oder andere Dateien mit sensiblen Daten

**Für andere Nutzer:** Jeder muss seine eigene Home Assistant Konfiguration beim ersten Start eingeben.

## Voraussetzungen

- Node.js (Version 18 oder höher)
- npm oder yarn
- Eine laufende Home Assistant Instanz
- Home Assistant Long-Lived Access Token

## Installation

1. Repository klonen oder herunterladen:
```bash
git clone <repository-url>
cd HomeAssistant-Status
```

2. Dependencies installieren:
```bash
npm install
```

3. Entwicklungsserver starten:
```bash
npm run dev
```

4. Im Browser öffnen (normalerweise `http://localhost:5173`)

## Konfiguration

### Home Assistant Long-Lived Access Token erstellen

1. In Home Assistant einloggen
2. Auf dein Profil klicken (unten links)
3. Zum Abschnitt "Long-Lived Access Tokens" scrollen
4. Auf "Create Token" klicken
5. Einen Namen eingeben (z.B. "Status Dashboard")
6. Token kopieren und sicher aufbewahren

### Statusseite konfigurieren

1. Beim ersten Start öffnet sich automatisch das Konfigurationsmodal
2. Home Assistant URL eingeben (z.B. `http://homeassistant.local:8123`)
3. Access Token einfügen
4. "Verbindung testen" klicken um die Verbindung zu prüfen
5. "Speichern" klicken

Die Konfiguration wird im Browser Local Storage gespeichert und muss nur einmal eingegeben werden.

## System Monitor Sensoren einrichten (Optional)

Für die System-Metriken benötigt Home Assistant den System Monitor Integration:

1. In Home Assistant zu Einstellungen → Geräte & Dienste
2. "Integration hinzufügen" klicken
3. Nach "System Monitor" suchen und hinzufügen
4. Folgende Sensoren aktivieren:
   - Processor use (%)
   - Memory use (%)
   - Disk use (%)

Die Statusseite zeigt automatisch diese Metriken an, sobald sie verfügbar sind.

## Entwicklung

### Projekt-Struktur

```
src/
├── services/
│   └── homeassistant.ts    # Home Assistant API Integration
├── components/
│   ├── ConfigModal.tsx     # Konfigurationsdialog
│   ├── DeviceStatus.tsx    # Gerätestatus-Anzeige
│   ├── SystemMetrics.tsx   # System-Metriken-Anzeige
│   └── HistoricalChart.tsx # Historische Daten Charts
├── App.tsx                 # Haupt-Dashboard
└── App.css                 # Styling
```

### Verfügbare Befehle

```bash
# Entwicklungsserver starten
npm run dev

# Produktion Build erstellen
npm run build

# Build Vorschau
npm run preview

# Linting
npm run lint
```

## Deployment für Production (Internet-Zugriff)

### Vorbereitungen

**Wichtig:** Für Internet-Zugriff über eine Domain sind folgende Schritte notwendig:

1. **CORS in Home Assistant aktualisieren** - Füge deine Production Domain hinzu:
```yaml
# configuration.yaml
http:
  cors_allowed_origins:
    - "http://localhost:5173"           # Entwicklung
    - "https://deine-domain.de"         # Production
    - "https://www.deine-domain.de"     # Falls mit www
```

2. **HTTPS verwenden** - Für sichere Verbindungen ist HTTPS zwingend erforderlich!

### Deployment auf einem Server mit Nginx

#### 1. Production Build erstellen

Auf deinem lokalen Rechner:
```bash
npm run build
```

Der `dist` Ordner enthält alle produktionsreifen Dateien.

#### 2. Dateien auf den Server übertragen

```bash
# Mit SCP (ersetze die Werte entsprechend)
scp -r dist/* user@dein-server:/var/www/homeassistant-status/

# Oder mit rsync
rsync -avz dist/ user@dein-server:/var/www/homeassistant-status/
```

#### 3. Nginx konfigurieren

Auf dem Server:

```bash
# Kopiere die Beispiel-Konfiguration
sudo nano /etc/nginx/sites-available/ha-status

# Füge die Konfiguration ein (siehe nginx.conf.example)
# Passe folgende Werte an:
# - deine-domain.de → deine echte Domain
# - SSL Zertifikat Pfade
# - root Pfad zu deinem dist Ordner

# Aktiviere die Seite
sudo ln -s /etc/nginx/sites-available/ha-status /etc/nginx/sites-enabled/

# Teste die Konfiguration
sudo nginx -t

# Starte Nginx neu
sudo systemctl restart nginx
```

#### 4. SSL-Zertifikat mit Let's Encrypt (empfohlen)

```bash
# Installiere Certbot
sudo apt install certbot python3-certbot-nginx

# Erstelle Zertifikat
sudo certbot --nginx -d deine-domain.de -d www.deine-domain.de

# Certbot konfiguriert automatisch HTTPS!
```

### Alternative: Docker Deployment

Beispiel Dockerfile:
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.example /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Docker Container starten:
```bash
docker build -t ha-status .
docker run -d -p 80:80 -p 443:443 ha-status
```

### Home Assistant über Internet erreichbar machen (Optional)

**WARNUNG:** Nur mit entsprechenden Sicherheitsmaßnahmen!

Optionen:
1. **Nabu Casa Cloud** (empfohlen für Anfänger) - Offizieller Cloud-Service
2. **Reverse Proxy** - Siehe `nginx.conf.example` für Beispiel
3. **Tailscale/Wireguard VPN** - Sicherer Zugriff ohne Port-Freigabe

Wenn du Home Assistant über eine Subdomain erreichbar machst (z.B. `ha.deine-domain.de`), kannst du in der Statusseite dann diese URL verwenden.

## Technologie-Stack

- **React** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool & Dev Server
- **Axios** - HTTP Client
- **Recharts** - Chart Library
- **Lucide React** - Icons
- **Home Assistant REST API** - Backend Integration

## Anpassungen

### Farben ändern

Die Hauptfarben können in der `App.css` Datei angepasst werden:

```css
.app {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
}
```

### Update-Intervalle anpassen

In den jeweiligen Komponenten (`DeviceStatus.tsx`, `SystemMetrics.tsx`):

```typescript
// 5 Sekunden für Gerätestatus
const interval = setInterval(loadEntities, 5000);

// 10 Sekunden für System-Metriken
const interval = setInterval(loadMetrics, 10000);
```

## Fehlerbehebung

### Verbindung zu Home Assistant schlägt fehl

- Überprüfe die Home Assistant URL (inkl. Port, normalerweise 8123)
- Stelle sicher, dass der Access Token korrekt ist
- Bei HTTPS: Überprüfe das SSL-Zertifikat
- Prüfe die Browser-Konsole auf CORS-Fehler

### CORS-Probleme

Falls CORS-Fehler auftreten, muss in der Home Assistant `configuration.yaml` folgendes hinzugefügt werden:

```yaml
http:
  cors_allowed_origins:
    - "http://localhost:5173"  # Entwicklung
    - "https://your-domain.com"  # Produktion
```

### Keine System-Metriken sichtbar

- Stelle sicher, dass die System Monitor Integration in Home Assistant installiert ist
- Warte einige Minuten, bis die Sensoren Daten liefern
- Überprüfe in Home Assistant ob die Sensoren `sensor.processor_use`, `sensor.memory_use` etc. existieren

## Lizenz

MIT

## Mitwirken

Contributions sind willkommen! Bitte erstelle ein Issue oder Pull Request.

## Support

Bei Fragen oder Problemen erstelle bitte ein Issue im Repository.
