# Home Assistant Status Dashboard

Eine moderne, React-basierte Status- und Steuerungsseite für Home Assistant mit konfigurierbaren Kacheln, flexiblem Dashboard-Layout und mehrstufigem Zugriffssystem.

![Home Assistant Status Dashboard](screenshot.png)

## ✨ Features

### 🎨 Flexibles Dashboard-System
- **Konfigurierbare Kacheln**: Erstelle individuelle Kacheln für deine Geräte und Sensoren
- **4 Kachel-Typen**:
  - 📊 **Wert-Anzeige** - Einzelner Sensorwert (z.B. Temperatur, Luftfeuchtigkeit)
  - 📊 **Multi-Wert-Anzeige** - Mehrere Werte in einer Kachel (z.B. CPU, RAM, Disk)
  - 🔘 **Schalter (Toggle)** - Ein/Aus Steuerung (z.B. Lichter, Steckdosen)
  - 🔲 **Taster (Button)** - Einmalige Aktion ausführen (z.B. Skripte, Szenen)
- **Flexible Größen**: 1x1, 2x1, 1x2, 2x2 (Klein, Breit, Hoch, Groß)
- **Drag & Drop**: Einfache Neuanordnung der Kacheln
- **Import/Export**: Sichere deine Dashboard-Konfiguration als JSON-Datei

### 🔐 Drei-Stufen-Zugriffssystem
- **`/`** - Öffentliches Dashboard (Read-Only)
  - Für alle zugänglich
  - Nur Anzeige von Daten
  - Steuerungselemente deaktiviert
- **`/admin`** - Admin-Konfiguration (nur lokal)
  - Nur aus lokalem Netzwerk erreichbar
  - Home Assistant Verbindung einrichten
  - Dashboard-Titel konfigurieren
  - Kacheln erstellen, bearbeiten, sortieren
- **`/adminDashboard`** - Admin-Dashboard (passwortgeschützt)
  - Optional aus Internet erreichbar (mit HTTP Basic Auth)
  - Volle Steuerung aller Geräte
  - Funktionsfähige Schalter und Taster

### 🛠️ Weitere Features
- **Echtzeit-Updates**: Automatische Aktualisierung der Daten alle 5 Sekunden
- **Responsive Design**: Optimiert für Desktop (4 Spalten), Tablet (2 Spalten), Mobile (1 Spalte)
- **Dark Mode**: Modernes dunkles Design mit ansprechenden Farbverläufen
- **Sichere Konfiguration**: Zugangsdaten werden nur lokal im Browser gespeichert (Local Storage)
- **Entity Browser**: Automatisches Laden aller verfügbaren Home Assistant Entities
- **Icon Support**: Emoji-Icons für Kacheln

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

## 🚀 Schnellstart

### 1. Home Assistant Long-Lived Access Token erstellen

1. In Home Assistant einloggen
2. Auf dein Profil klicken (unten links)
3. Zum Abschnitt "Long-Lived Access Tokens" scrollen
4. Auf "Create Token" klicken
5. Einen Namen eingeben (z.B. "Status Dashboard")
6. Token kopieren und sicher aufbewahren

### 2. Dashboard einrichten

1. Öffne `/admin` im Browser (nur aus lokalem Netzwerk erreichbar)
2. **Home Assistant Verbindung konfigurieren**:
   - Home Assistant URL eingeben (z.B. `http://homeassistant.local:8123`)
   - Access Token einfügen
   - "Verbindung testen" klicken
   - "Speichern" klicken
3. **Dashboard-Titel setzen** (z.B. "Mein Smart Home")
4. **Kacheln erstellen**:
   - Klicke auf "Neue Kachel"
   - Wähle einen Kachel-Typ (Wert, Multi-Wert, Schalter, Taster)
   - Wähle eine Entity aus dem Dropdown (automatisch geladen)
   - Setze Titel, Icon (Emoji) und Größe
   - Speichern
5. **Dashboard ansehen**: Klicke auf "Öffentliches Dashboard" oder öffne `/`

### 3. Dashboard-Konfiguration sichern

- **Exportieren**: Klicke im Admin-Bereich auf "Exportieren" um eine JSON-Backup-Datei herunterzuladen
- **Importieren**: Klicke auf "Importieren" um eine gespeicherte Konfiguration wiederherzustellen

## 📋 Dashboard-Anwendungsbeispiele

### Beispiel 1: System-Monitoring Dashboard
Erstelle eine **Multi-Wert-Kachel** (2x1) mit:
- Entity 1: `sensor.processor_use` (Label: "CPU", Unit: "%")
- Entity 2: `sensor.memory_use_percent` (Label: "RAM", Unit: "%")
- Entity 3: `sensor.disk_use_percent` (Label: "Disk", Unit: "%")

### Beispiel 2: Wohnzimmer-Steuerung
- **Schalter-Kachel** (1x1): `light.wohnzimmer` (Titel: "Wohnzimmer Licht")
- **Wert-Kachel** (1x1): `sensor.wohnzimmer_temperature` (Titel: "Temperatur", Unit: "°C")
- **Wert-Kachel** (1x1): `sensor.wohnzimmer_humidity` (Titel: "Luftfeuchtigkeit", Unit: "%")
- **Taster-Kachel** (1x1): `script.movie_mode` (Titel: "Kino-Modus")

### Beispiel 3: Energie-Dashboard
- **Multi-Wert-Kachel** (2x2) für aktuelle Verbräuche
- **Wert-Kacheln** (1x1) für Einzelgeräte
- **Schalter-Kacheln** (1x1) für steuerbare Steckdosen

## Entwicklung

### Projekt-Struktur

```
src/
├── services/
│   └── homeassistant.ts           # Home Assistant REST API Service
├── components/
│   ├── ConfigModal.tsx            # HA Verbindungs-Konfiguration
│   ├── TileEditor.tsx             # Kachel-Editor Modal
│   └── tiles/
│       ├── ValueTile.tsx          # Einzelwert-Kachel
│       ├── MultiValueTile.tsx     # Multi-Wert-Kachel
│       ├── ButtonTile.tsx         # Taster-Kachel
│       └── ToggleTile.tsx         # Schalter-Kachel
├── pages/
│   ├── Dashboard.tsx              # Öffentliches Dashboard (/)
│   ├── Admin.tsx                  # Admin-Konfiguration (/admin)
│   └── AdminDashboard.tsx         # Admin-Dashboard (/adminDashboard)
├── types/
│   └── dashboard.ts               # TypeScript Typen
├── App.tsx                        # Router Setup
└── App.css                        # Styling
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

## 🌐 Deployment für Production (Internet-Zugriff)

### 🔥 Nginx Proxy Manager Setup (Empfohlen)

**Du nutzt Nginx Proxy Manager?** Perfekt! Wähle die passende Anleitung:

#### Deployment-Guides:
- **[NGINX_PROXY_MANAGER_SETUP.md](./NGINX_PROXY_MANAGER_SETUP.md)** - Basis-Setup für öffentliches Dashboard
- **[MANUAL_DEPLOYMENT.md](./MANUAL_DEPLOYMENT.md)** - Für Benutzer OHNE SSH-Zugang (FTP/Web-Interface)
- **[ADMIN_AUTHENTICATION.md](./ADMIN_AUTHENTICATION.md)** - HTTP Basic Auth für Admin-Dashboard

#### Server-Automatisierung:
- **`install.sh`** - Automatisches Server-Setup (Node.js, PM2, Nginx)
- **`update.sh`** - Git Pull, Build & PM2 Restart

Mit Nginx Proxy Manager kannst du:
- ✅ Öffentliches Dashboard (`/`) im Internet veröffentlichen
- ✅ Home Assistant intern lassen
- ✅ API-Zugriff über Proxy absichern
- ✅ Admin-Bereich (`/admin`) nur lokal erreichbar
- ✅ Admin-Dashboard (`/adminDashboard`) mit Passwortschutz
- ✅ Automatisches SSL mit Let's Encrypt

---

### Vorbereitungen (Manuelles Nginx Setup)

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

## 🎨 Anpassungen

### Dashboard-Layout anpassen

**Grid-System** (in `App.css`):
```css
/* Desktop: 4 Spalten */
.dashboard-tiles {
  grid-template-columns: repeat(4, 1fr);
}

/* Tablet: 2 Spalten */
@media (max-width: 1024px) {
  .dashboard-tiles {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Mobile: 1 Spalte */
@media (max-width: 768px) {
  .dashboard-tiles {
    grid-template-columns: 1fr;
  }
}
```

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

In den Tile-Komponenten (z.B. `ValueTile.tsx`, `MultiValueTile.tsx`):

```typescript
// Aktuell: 5 Sekunden
const interval = setInterval(loadValue, 5000);

// Ändern auf 10 Sekunden:
const interval = setInterval(loadValue, 10000);
```

## 🔧 Fehlerbehebung

### Verbindung zu Home Assistant schlägt fehl

- ✅ Überprüfe die Home Assistant URL (inkl. Port, normalerweise 8123)
- ✅ Stelle sicher, dass der Access Token korrekt ist
- ✅ Bei HTTPS: Überprüfe das SSL-Zertifikat
- ✅ Prüfe die Browser-Konsole auf CORS-Fehler (F12 → Console)
- ✅ Teste die Verbindung im Admin-Bereich (`/admin`)

### CORS-Probleme

Falls CORS-Fehler auftreten, muss in der Home Assistant `configuration.yaml` folgendes hinzugefügt werden:

```yaml
http:
  cors_allowed_origins:
    - "http://localhost:5173"           # Entwicklung
    - "https://ha-status.deine-domain.de"  # Production
```

**Nach Änderungen**: Home Assistant neu starten!

### Kacheln zeigen "Fehler" oder "Laden..."

- ✅ Prüfe ob die Entity-ID korrekt ist
- ✅ Überprüfe in Home Assistant ob die Entity existiert (Entwicklerwerkzeuge → Zustände)
- ✅ Warte 5 Sekunden (Auto-Refresh)
- ✅ Prüfe Browser-Konsole auf API-Fehler

### Admin-Bereich gibt 404 (von außen)

✅ **Das ist richtig!** `/admin` ist nur aus dem lokalen Netzwerk erreichbar.

Verwende stattdessen `/adminDashboard` mit Passwortschutz für externen Zugriff (siehe ADMIN_AUTHENTICATION.md).

### Drag & Drop funktioniert nicht

- ✅ Stelle sicher, dass du auf dem **öffentlichen Dashboard** (`/`) bist
- ✅ Klicke und halte die Kachel für 200ms bevor du ziehst
- ✅ Mobile: Drag & Drop funktioniert nur auf Touch-fähigen Geräten mit Browser-Support

### Import schlägt fehl

- ✅ Stelle sicher, dass die JSON-Datei gültig ist
- ✅ Die Datei muss von diesem Dashboard exportiert worden sein
- ✅ Prüfe die Browser-Konsole auf Fehlermeldungen

## 📚 Weitere Dokumentation

- **[CLAUDE.md](./CLAUDE.md)** - Technische Dokumentation für Entwickler und Claude Code
- **[NGINX_PROXY_MANAGER_SETUP.md](./NGINX_PROXY_MANAGER_SETUP.md)** - Nginx Proxy Manager Setup
- **[ADMIN_AUTHENTICATION.md](./ADMIN_AUTHENTICATION.md)** - HTTP Basic Auth für Admin-Dashboard
- **[MANUAL_DEPLOYMENT.md](./MANUAL_DEPLOYMENT.md)** - Manuelle Bereitstellung ohne SSH

## 🏗️ Projekt-Roadmap

### ✅ Aktuell implementiert
- [x] Flexibles Kachel-System (4 Typen: Value, Multi-Value, Button, Toggle)
- [x] Drei-Stufen-Zugriffssystem (/, /admin, /adminDashboard)
- [x] Drag & Drop Neuanordnung
- [x] Import/Export Konfiguration (JSON Backup)
- [x] Responsive Grid-Layout (Desktop/Tablet/Mobile)
- [x] HTTP Basic Auth Support
- [x] Entity Browser (automatisches Laden aller Entities)
- [x] Flexible Kachel-Größen (1x1, 2x1, 1x2, 2x2)

---

### 🎯 TODO-Liste (nach Priorität)

#### 🔥 Hohe Priorität - Benutzerfreundlichkeit

- [ ] **Kachel-Vorschau im TileEditor**
  - Live-Vorschau während der Bearbeitung
  - Zeigt sofort, wie die Kachel aussehen wird
  - Verhindert Trial-and-Error
  - _Aufwand: ~30 Min | Impact: ⭐⭐⭐⭐⭐_

- [ ] **Toast-Benachrichtigungen**
  - Erfolgs-/Fehlermeldungen anzeigen
  - Library: `react-hot-toast`
  - Feedback für Benutzeraktionen (Speichern, Löschen, Fehler)
  - _Aufwand: ~20 Min | Impact: ⭐⭐⭐⭐_

- [ ] **Besseres Fehler-Feedback**
  - Zeige genau, welche Entity nicht gefunden wurde
  - Verbindungsstatus deutlicher anzeigen
  - Fehlerhafte Kacheln rot markieren
  - _Aufwand: ~40 Min | Impact: ⭐⭐⭐⭐_

- [ ] **Loading States verbessern**
  - Skeleton Screens statt "Laden..."
  - Progress Bar beim Import/Export
  - Spinner für Entity-Dropdown
  - _Aufwand: ~1h | Impact: ⭐⭐⭐_

---

#### 🚀 Mittlere Priorität - Funktionalität

- [ ] **Historische Daten & Charts**
  - Line Charts für Temperatur/Sensoren über Zeit
  - Area Charts für Energie-Verbrauch
  - Konfigurierbare Zeiträume (24h, 7d, 30d)
  - Chart-Kachel-Typ hinzufügen
  - _Aufwand: ~2h | Impact: ⭐⭐⭐⭐⭐_

- [ ] **Kamera-Kachel**
  - Kamera-Feeds anzeigen (entity: `camera.*`)
  - Konfigurierbares Refresh-Interval
  - Optional: PTZ-Controls für steuerbare Kameras
  - _Aufwand: ~1.5h | Impact: ⭐⭐⭐⭐_

- [ ] **Gruppierung & Räume**
  - Kacheln in Räume gruppieren (Wohnzimmer, Schlafzimmer, etc.)
  - Collapsible Sections
  - Tabs für verschiedene Bereiche
  - Reihenfolge der Gruppen änderbar
  - _Aufwand: ~3h | Impact: ⭐⭐⭐⭐⭐_

- [ ] **Szenen-Kachel**
  - Mehrere Aktionen in einer Kachel kombinieren
  - z.B. "Gute Nacht" → Alle Lichter aus + Heizung runter
  - Szenen aus Home Assistant importieren
  - _Aufwand: ~1h | Impact: ⭐⭐⭐⭐_

- [ ] **Bedingte Kacheln**
  - Kacheln nur unter bestimmten Bedingungen anzeigen
  - z.B. "Fenster offen"-Warnung nur wenn Fenster offen
  - Template-basierte Bedingungen
  - _Aufwand: ~2h | Impact: ⭐⭐⭐_

- [ ] **Wetter-Kachel**
  - Wetter-Integration (OpenWeather, DWD, etc.)
  - 5-Tage-Vorhersage
  - Icons für Wetterbedingungen
  - _Aufwand: ~1.5h | Impact: ⭐⭐⭐⭐_

---

#### 🎨 Niedrige Priorität - Design & UX

- [ ] **Themes & Dark/Light Mode**
  - Light Mode Toggle
  - Custom Color Themes
  - Theme-Builder im Admin-Bereich
  - Persistierung der Theme-Wahl
  - _Aufwand: ~2h | Impact: ⭐⭐⭐_

- [ ] **Animationen verbessern**
  - Smooth Transitions beim Drag & Drop
  - Fade-in für neue Kacheln
  - Button Ripple Effects
  - Hover-Animationen
  - _Aufwand: ~1h | Impact: ⭐⭐_

- [ ] **Custom Icons**
  - Upload eigener Icon-Dateien
  - Integration von Icon-Libraries (Material Icons, Font Awesome)
  - Icon-Picker im TileEditor
  - _Aufwand: ~1.5h | Impact: ⭐⭐⭐_

- [ ] **Kachel-Hintergründe**
  - Custom Background-Colors pro Kachel
  - Gradient-Optionen
  - Hintergrundbild-Support
  - _Aufwand: ~1h | Impact: ⭐⭐_

---

#### 📱 Mobile & PWA

- [ ] **Progressive Web App (PWA)**
  - Installierbar auf Smartphone/Desktop
  - Offline-Funktionalität (Service Worker)
  - App-Icon & Splash Screen
  - Manifest.json konfigurieren
  - _Aufwand: ~2h | Impact: ⭐⭐⭐⭐⭐_

- [ ] **Push Notifications (optional)**
  - Benachrichtigungen bei wichtigen Events
  - z.B. "Tür offen seit 10 Minuten"
  - Konfigurierbare Trigger
  - _Aufwand: ~3h | Impact: ⭐⭐⭐_

- [ ] **Touch-Gesten**
  - Swipe für Navigation
  - Long-Press für Kachel-Optionen
  - Pinch-to-Zoom (optional)
  - _Aufwand: ~1.5h | Impact: ⭐⭐_

---

#### 🔧 Technische Verbesserungen

- [ ] **Error Boundary**
  - Verhindert, dass eine fehlerhafte Kachel das ganze Dashboard crasht
  - Fallback-UI für fehlerhafte Komponenten
  - Error Reporting (optional: Sentry)
  - _Aufwand: ~30 Min | Impact: ⭐⭐⭐⭐_

- [ ] **Performance Optimierung**
  - React.memo für Tiles (weniger Re-Renders)
  - Virtualisierung bei vielen Kacheln (react-window)
  - Lazy Loading für nicht-sichtbare Kacheln
  - _Aufwand: ~2h | Impact: ⭐⭐⭐_

- [ ] **TypeScript Strictness**
  - Stricter Type Checking
  - Discriminated Unions perfektionieren
  - Type Guards für alle Tile-Typen
  - _Aufwand: ~1h | Impact: ⭐⭐_

- [ ] **Testing**
  - Unit Tests für kritische Funktionen (Vitest)
  - Component Tests für Tiles
  - E2E Tests (Playwright)
  - _Aufwand: ~4h | Impact: ⭐⭐⭐_

- [ ] **Mehrsprachigkeit (i18n)**
  - Englisch / Deutsch umschaltbar
  - Browser-Sprache automatisch erkennen
  - react-i18next Integration
  - _Aufwand: ~2h | Impact: ⭐⭐⭐_

---

#### 🔐 Sicherheit

- [ ] **Token Encryption**
  - Access Token im Browser verschlüsseln
  - Crypto-API nutzen statt plaintext localStorage
  - _Aufwand: ~1h | Impact: ⭐⭐⭐_

- [ ] **Session Timeout**
  - Automatisches Logout nach Inaktivität
  - Re-Authentication erforderlich
  - Konfigurierbare Timeout-Dauer
  - _Aufwand: ~1h | Impact: ⭐⭐_

- [ ] **Audit Log**
  - Wer hat wann welche Änderung gemacht
  - Hilfreich bei mehreren Benutzern
  - Export als CSV
  - _Aufwand: ~2h | Impact: ⭐⭐_

- [ ] **Zwei-Faktor-Authentifizierung (2FA)**
  - Optional für Admin-Dashboard
  - TOTP-basiert (Google Authenticator)
  - _Aufwand: ~3h | Impact: ⭐⭐⭐_

---

#### 🌐 Erweiterte Features

- [ ] **Multi-Dashboard Support**
  - Mehrere Dashboards erstellen (Wohnzimmer, Schlafzimmer, etc.)
  - Dashboard-Switcher im Header
  - Separate Konfigurationen pro Dashboard
  - _Aufwand: ~3h | Impact: ⭐⭐⭐⭐_

- [ ] **Benutzer-Verwaltung**
  - Mehrere Benutzer mit verschiedenen Rollen
  - Admin, Editor, Viewer Rollen
  - Rechteverwaltung pro Dashboard
  - _Aufwand: ~5h | Impact: ⭐⭐⭐_

- [ ] **Automationen & Scripts**
  - Automationen aus HA importieren
  - Scripts direkt vom Dashboard ausführen
  - Automation-Builder (optional)
  - _Aufwand: ~2h | Impact: ⭐⭐⭐⭐_

- [ ] **Kalender-Integration**
  - Google Calendar / iCal Integration
  - Anzeige bevorstehender Events
  - Kalender-Kachel
  - _Aufwand: ~2h | Impact: ⭐⭐⭐_

---

### 📊 Prioritäten-Empfehlung

**Nächste 3 Features (Quick Wins):**
1. 🥇 Kachel-Vorschau im TileEditor
2. 🥈 Toast-Benachrichtigungen
3. 🥉 Error Boundary

**Langfristig (High Impact):**
1. Historische Daten & Charts
2. PWA Support
3. Gruppierung & Räume
4. Multi-Dashboard Support

## 🤝 Mitwirken

Contributions sind willkommen!

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/amazing-feature`)
3. Commit deine Änderungen (`git commit -m 'Add amazing feature'`)
4. Push zum Branch (`git push origin feature/amazing-feature`)
5. Öffne einen Pull Request

## 📝 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details

## 💬 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/SHP-ART/HomeAssistant-Status/issues)
- 💡 **Feature Requests**: [GitHub Issues](https://github.com/SHP-ART/HomeAssistant-Status/issues)
- 📧 **Fragen**: Erstelle ein Issue oder diskutiere in den Discussions

## 🙏 Credits

Entwickelt mit:
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Home Assistant](https://www.home-assistant.io/)
- [Lucide Icons](https://lucide.dev/)

---

**Made with ❤️ for the Home Assistant Community**
