# Manuelle Bereitstellung ohne SSH-Zugang

Diese Anleitung ist für Benutzer gedacht, die **keinen SSH-Zugang** zu ihrem Server haben oder die Bereitstellung lieber manuell durchführen möchten.

## Überblick

Die manuelle Bereitstellung besteht aus drei Hauptschritten:
1. Production Build auf deinem Computer erstellen
2. Dateien auf den Server hochladen
3. In Nginx Proxy Manager einbinden

## Schritt 1: Production Build lokal erstellen

### Voraussetzungen

Stelle sicher, dass Node.js auf deinem Computer installiert ist:
- Node.js Version 18 oder höher
- Du kannst die Version prüfen mit: `node --version`

### Build erstellen

1. **Terminal/Kommandozeile öffnen**
   - **Windows**: Drücke `Win + R`, tippe `cmd` und drücke Enter
   - **macOS**: Öffne `Terminal` aus dem Programme-Ordner
   - **Linux**: Öffne dein Terminal

2. **Navigiere zum Projektverzeichnis**
   ```bash
   cd /pfad/zu/HomeAssistant-Status
   ```
   Beispiel Windows: `cd C:\Users\DeinName\Documents\HomeAssistant-Status`

   Beispiel macOS/Linux: `cd ~/Documents/HomeAssistant-Status`

3. **Dependencies installieren** (nur beim ersten Mal nötig)
   ```bash
   npm install
   ```
   Dieser Schritt kann einige Minuten dauern.

4. **Production Build erstellen**
   ```bash
   npm run build
   ```

   Wenn alles erfolgreich war, siehst du eine Ausgabe wie:
   ```
   vite v7.x.x building for production...
   ✓ built in 5.23s
   ```

5. **Build-Ordner finden**

   Nach dem erfolgreichen Build findest du einen neuen Ordner namens **`dist`** im Projektverzeichnis:
   ```
   HomeAssistant-Status/
   ├── dist/                 ← Dieser Ordner enthält die fertigen Dateien!
   │   ├── index.html
   │   ├── assets/
   │   │   ├── index-abc123.js
   │   │   └── index-xyz789.css
   │   └── vite.svg
   ├── src/
   ├── package.json
   └── ...
   ```

   **WICHTIG:** Der gesamte Inhalt des `dist/` Ordners muss auf den Server hochgeladen werden!

## Schritt 2: Dateien auf den Server hochladen

Du hast mehrere Möglichkeiten, die Dateien auf deinen Server zu laden:

### Option A: FTP/SFTP (Empfohlen für Anfänger)

**Was du brauchst:**
- FTP-Client wie [FileZilla](https://filezilla-project.org/) (kostenlos)
- FTP-Zugangsdaten von deinem Hosting-Provider

**Schritt-für-Schritt:**

1. **FileZilla installieren und öffnen**

2. **Mit Server verbinden**
   - **Host**: `ftp.deinserver.de` oder IP-Adresse
   - **Benutzername**: Dein FTP-Benutzername
   - **Passwort**: Dein FTP-Passwort
   - **Port**: `21` (FTP) oder `22` (SFTP)
   - Klicke auf "Verbinden"

3. **Zielverzeichnis erstellen/auswählen**

   Auf der rechten Seite (Server) navigiere zu einem geeigneten Ordner, z.B.:
   - `/var/www/ha-status/`
   - `/home/user/web/ha-status/`
   - `/usr/share/nginx/html/ha-status/`

   (Der genaue Pfad hängt von deinem Server-Setup ab)

4. **Dateien hochladen**
   - Auf der linken Seite (Lokal): Navigiere zum `dist/` Ordner
   - Markiere **ALLE** Dateien und Ordner im `dist/` Ordner
   - Ziehe sie per Drag & Drop auf die rechte Seite (Server)
   - Warte, bis alle Dateien hochgeladen sind

5. **Berechtigungen setzen** (falls nötig)
   - Rechtsklick auf `index.html` → Dateiberechtigungen
   - Setze auf `644` (rw-r--r--)
   - Für Ordner: `755` (rwxr-xr-x)

**Erwartetes Ergebnis auf dem Server:**
```
/var/www/ha-status/
├── index.html
├── assets/
│   ├── index-abc123.js
│   └── index-xyz789.css
└── vite.svg
```

### Option B: Web-Interface (z.B. cPanel, Plesk)

Falls dein Hosting-Provider ein Web-Interface bietet:

1. **Einloggen** ins Hosting Control Panel (cPanel, Plesk, etc.)

2. **Dateimanager öffnen**
   - In cPanel: "Dateimanager" / "File Manager"
   - In Plesk: "Dateien" / "Files"

3. **Ordner erstellen**
   - Navigiere zu `public_html` oder `htdocs`
   - Erstelle einen neuen Ordner, z.B. `ha-status`

4. **Dateien hochladen**
   - Öffne den neu erstellten Ordner
   - Nutze die "Upload" Funktion
   - Wähle ALLE Dateien aus dem `dist/` Ordner
   - Hochladen und auf Fertigstellung warten

5. **ZIP-Upload (Alternative)**

   Falls der Upload vieler einzelner Dateien zu lange dauert:

   a. Erstelle ein ZIP-Archiv vom `dist/` Ordner Inhalt (nicht vom Ordner selbst!)
      - **Windows**: Markiere alle Dateien IN dist/, Rechtsklick → "Senden an" → "ZIP-komprimierter Ordner"
      - **macOS**: Markiere alle Dateien IN dist/, Rechtsklick → "X Objekte komprimieren"

   b. Lade die ZIP-Datei hoch

   c. Entpacke sie im Dateimanager (meist per Rechtsklick → "Extract" / "Entpacken")

### Option C: SCP/WinSCP (für Windows-Benutzer mit Server-Zugang)

Falls du einen Windows-PC hast und SSH-Zugangsdaten, aber kein SSH verwenden möchtest:

1. **WinSCP herunterladen** von [winscp.net](https://winscp.net/)

2. **Neue Verbindung erstellen**
   - Protokoll: `SFTP`
   - Host: IP-Adresse oder Domain deines Servers
   - Port: `22`
   - Benutzername & Passwort eingeben

3. **Verbinden** und wie bei FTP die Dateien hochladen

### Option D: Cloud-Storage (Umweg über Cloud)

Falls keine der obigen Optionen funktioniert:

1. **Lade den `dist/` Ordner zu einem Cloud-Speicher hoch** (Google Drive, Dropbox, etc.)

2. **Auf dem Server**:
   - Falls du Zugang zu einem Web-Browser auf dem Server hast
   - Lade die Dateien von der Cloud herunter
   - Entpacke sie im richtigen Verzeichnis

**Hinweis:** Diese Methode ist umständlich und nur als letzte Option gedacht.

## Schritt 3: In Nginx Proxy Manager einbinden

### Vorbereitungen

**Wichtig:** Notiere dir den Pfad, wo du die Dateien hochgeladen hast!

Beispiele:
- `/var/www/ha-status/`
- `/home/user/public_html/ha-status/`
- `C:\inetpub\wwwroot\ha-status\` (Windows Server)

### Nginx Proxy Manager konfigurieren

1. **Nginx Proxy Manager öffnen**
   - Normalerweise erreichbar unter: `http://dein-server:81`
   - Einloggen mit deinen Zugangsdaten

2. **Neuen Proxy Host erstellen**
   - Klicke auf **"Proxy Hosts"**
   - Klicke auf **"Add Proxy Host"**

3. **Tab "Details" ausfüllen**

   - **Domain Names**: `ha-status.deine-domain.de`
     (Ersetze mit deiner tatsächlichen Domain)

   - **Scheme**: `http`

   - **Forward Hostname / IP**:
     - Wenn Nginx Proxy Manager auf demselben Server läuft: `localhost`
     - Sonst: Die IP-Adresse des Servers, wo die Dateien liegen

   - **Forward Port**:
     - Wenn du einen Webserver wie Apache/Nginx hast: `80`
     - Wenn du nur statische Dateien hostest: siehe unten "Statischer Webserver"

   - **Checkboxen**:
     - ✅ Block Common Exploits
     - ✅ Websockets Support

4. **Tab "SSL" konfigurieren**

   - ✅ **SSL Certificate**:
     - Wähle "Request a new SSL Certificate"
     - Oder wähle ein bestehendes

   - **Email für Let's Encrypt**: deine@email.de

   - ✅ Force SSL
   - ✅ HTTP/2 Support
   - ✅ HSTS Enabled

5. **Tab "Advanced" - Nginx-Konfiguration**

   Füge folgende Konfiguration ein:

   ```nginx
   # Admin-Bereich NUR aus lokalem Netzwerk erreichbar
   location /admin {
       # Erlaube nur lokales Netzwerk (PASSE DIES AN!)
       allow 192.168.1.0/24;     # Dein lokales Netzwerk
       allow 127.0.0.1;          # Localhost
       deny all;                 # Alle anderen blockieren

       try_files $uri $uri/ /index.html;

       # Verstecke Existenz der Admin-Seite
       error_page 403 = @forbidden;
   }

   location @forbidden {
       return 404;
   }

   # API Proxy zu Home Assistant (PASSE IP AN!)
   location /api {
       proxy_pass http://192.168.1.100:8123;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;

       # WebSocket Support
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";

       # CORS Headers (PASSE DOMAIN AN!)
       add_header Access-Control-Allow-Origin "https://ha-status.deine-domain.de" always;
       add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
       add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
       add_header Access-Control-Allow-Credentials "true" always;

       # Handle preflight requests
       if ($request_method = 'OPTIONS') {
           add_header Access-Control-Allow-Origin "https://ha-status.deine-domain.de" always;
           add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
           add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
           add_header Content-Length 0;
           add_header Content-Type text/plain;
           return 204;
       }
   }

   # Statische Dateien (öffentlich)
   location / {
       try_files $uri $uri/ /index.html;

       # Cache für Assets
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

   **WICHTIG - Folgende Werte anpassen:**

   a. **Dein lokales Netzwerk** (Zeile 4):
      - Finde deine lokale IP heraus:
        - **Windows**: `ipconfig` in CMD
        - **macOS**: `ifconfig` im Terminal
        - **Linux**: `ip addr` im Terminal
      - Wenn deine IP z.B. `192.168.1.50` ist:
        - Verwende `allow 192.168.1.0/24;`
      - Wenn deine IP z.B. `192.168.178.25` ist:
        - Verwende `allow 192.168.178.0/24;`
      - Wenn deine IP z.B. `10.0.0.15` ist:
        - Verwende `allow 10.0.0.0/24;`

   b. **Home Assistant IP-Adresse** (Zeile 17):
      - Ersetze `192.168.1.100` mit der IP deines Home Assistant Servers
      - Port `8123` ist Standard, ändere falls nötig

   c. **Deine Domain** (Zeilen 28 und 38):
      - Ersetze `ha-status.deine-domain.de` mit deiner tatsächlichen Domain

6. **Speichern**
   - Klicke auf **"Save"**
   - Nginx Proxy Manager lädt die Konfiguration neu

### Statischer Webserver benötigt?

Falls du keinen Webserver auf dem Server laufen hast, der die statischen Dateien ausliefert:

**Option 1: Nginx direkt verwenden**

Falls du Root-Zugriff hast, erstelle eine einfache Nginx-Config:

```nginx
server {
    listen 8080;
    server_name localhost;

    root /var/www/ha-status;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Dann in NPM als Forward Port `8080` angeben.

**Option 2: Python Simple HTTP Server**

Falls du SSH-Zugriff hast (oder Zugriff auf ein Terminal):

```bash
cd /var/www/ha-status
python3 -m http.server 8080
```

**WICHTIG:** Dieser Server sollte dauerhaft laufen (z.B. mit `systemd` oder `screen`).

Dann in NPM als Forward Port `8080` angeben.

**Option 3: NPM als direkter File Server**

Manche NPM-Setups können auch direkt statische Dateien ausliefern. Kontaktiere deinen Hosting-Provider für Details.

## Schritt 4: Home Assistant konfigurieren

Damit die API-Anfragen funktionieren, muss Home Assistant deine Domain kennen:

1. **Home Assistant öffnen**

2. **Zu Einstellungen → Add-ons, Backup & Überwachung → System**
   - Klicke auf die drei Punkte (⋮)
   - Wähle "Erweiterte Einstellungen"

3. **configuration.yaml bearbeiten**

   Füge folgendes hinzu (oder erweitere den bestehenden `http:` Block):

   ```yaml
   http:
     cors_allowed_origins:
       - "https://ha-status.deine-domain.de"

     # Falls Nginx Proxy Manager auf anderem Server läuft:
     use_x_forwarded_for: true
     trusted_proxies:
       - 192.168.1.0/24  # Dein lokales Netzwerk
   ```

   **WICHTIG:** Ersetze `ha-status.deine-domain.de` mit deiner tatsächlichen Domain!

4. **Home Assistant neu starten**
   - Einstellungen → System → Neustart
   - Warte ca. 1-2 Minuten

## Schritt 5: Testen

### Test 1: Öffentliches Dashboard

**Von überall (auch mobile Daten):**

1. Öffne: `https://ha-status.deine-domain.de`
2. **Erwartung**: ✅ Dashboard wird angezeigt
3. Falls nicht: Siehe "Fehlerbehebung" unten

### Test 2: Admin-Bereich (nur lokal)

**Im lokalen WLAN (gleiche Netzwerk wie Home Assistant):**

1. Öffne: `https://ha-status.deine-domain.de/admin`
2. **Erwartung**: ✅ Admin-Seite wird angezeigt
3. Konfiguriere die Home Assistant Verbindung:
   - URL: `https://ha-status.deine-domain.de` (ohne `/api`!)
   - Token: Dein Long-Lived Access Token
4. Erstelle Dashboard-Kacheln

**Von außerhalb (z.B. mobile Daten):**

1. Öffne: `https://ha-status.deine-domain.de/admin`
2. **Erwartung**: ❌ 404 Fehler (Admin-Bereich ist blockiert)

### Test 3: API-Verbindung

1. Öffne das Dashboard: `https://ha-status.deine-domain.de`
2. Drücke F12 (Browser Developer Tools)
3. Wechsle zum Tab "Netzwerk" / "Network"
4. Aktualisiere die Seite
5. **Erwartung**:
   - Du siehst Anfragen zu `/api/states`
   - Status: `200 OK` (grün)
   - Falls Status `403` oder `CORS error`: Siehe Fehlerbehebung

## Fehlerbehebung

### Problem: "404 Not Found" beim Öffnen der Seite

**Mögliche Ursachen:**

1. **Dateien nicht korrekt hochgeladen**
   - Überprüfe, ob `index.html` im richtigen Ordner liegt
   - Überprüfe den Pfad in deinem Webserver/NPM

2. **Nginx Config falsch**
   - Überprüfe den Forward Port in NPM
   - Stelle sicher, dass ein Webserver auf diesem Port läuft

3. **DNS nicht korrekt**
   - Überprüfe, ob deine Domain auf den Server zeigt
   - Nutze `ping ha-status.deine-domain.de`

**Lösung:**
- Überprüfe in NPM unter "Proxy Hosts" die Einstellungen
- Klicke auf die drei Punkte → "Edit"
- Verifiziere Domain, Forward Host und Port

### Problem: "502 Bad Gateway"

**Ursache:** Nginx Proxy Manager kann den Backend-Server nicht erreichen.

**Lösung:**

1. **Webserver läuft nicht**
   - Starte deinen Webserver (Nginx, Apache, etc.)
   - Oder starte den Python Simple HTTP Server

2. **Falscher Forward Port**
   - Überprüfe auf welchem Port dein Webserver läuft
   - Passe Forward Port in NPM an

3. **Firewall blockiert**
   - Überprüfe Firewall-Regeln auf dem Server
   - Erlaube Traffic auf dem Forward Port

### Problem: Admin-Seite gibt 404 (auch im lokalen Netzwerk)

**Ursache:** IP-Range in Nginx Config stimmt nicht mit deinem Netzwerk überein.

**Lösung:**

1. **Finde deine lokale IP:**
   - **Windows**: Öffne CMD, tippe `ipconfig`
   - **macOS/Linux**: Terminal, tippe `ip addr` oder `ifconfig`
   - Suche nach "IPv4-Adresse" oder "inet"
   - Beispiel: `192.168.1.50`

2. **Bestimme die richtige IP-Range:**
   - Die ersten drei Zahlen + `.0/24`
   - Bei `192.168.1.50` → `192.168.1.0/24`
   - Bei `192.168.178.25` → `192.168.178.0/24`
   - Bei `10.0.0.15` → `10.0.0.0/24`

3. **Nginx Config in NPM anpassen:**
   - Öffne den Proxy Host → Edit
   - Tab "Advanced"
   - Ändere `allow 192.168.1.0/24;` zu deiner IP-Range
   - Save

4. **Warte 10 Sekunden** und teste erneut

### Problem: CORS-Fehler in Browser Console

**Fehler sieht aus wie:**
```
Access to XMLHttpRequest at 'https://ha-status.deine-domain.de/api/...'
from origin 'https://ha-status.deine-domain.de' has been blocked by CORS policy
```

**Lösung:**

1. **Home Assistant configuration.yaml prüfen:**
   ```yaml
   http:
     cors_allowed_origins:
       - "https://ha-status.deine-domain.de"
   ```
   - Domain muss EXAKT gleich sein (inkl. `https://`)
   - Keine Leerzeichen am Anfang/Ende

2. **Home Assistant neu starten**
   - Einstellungen → System → Neustart

3. **Browser Cache leeren**
   - Strg + Shift + R (Windows/Linux)
   - Cmd + Shift + R (macOS)

4. **Nginx Config in NPM prüfen:**
   - Tab "Advanced"
   - Stelle sicher, dass Domain in CORS Headers stimmt (Zeile 28 + 38)

### Problem: API gibt 401 Unauthorized

**Ursache:** Access Token falsch oder abgelaufen.

**Lösung:**

1. **Neuen Token erstellen:**
   - Home Assistant → Profil (unten links)
   - "Long-Lived Access Tokens"
   - "Create Token"
   - Namen eingeben, Token kopieren

2. **In Admin-Bereich neu eingeben:**
   - `https://ha-status.deine-domain.de/admin`
   - Konfiguration öffnen (Zahnrad-Symbol)
   - Neuen Token einfügen
   - Speichern

### Problem: "Mixed Content" Warnung

**Ursache:** Dashboard verwendet HTTPS, aber Home Assistant HTTP.

**Lösung:**

Entweder:
- **Option A:** Nutze HTTPS für Home Assistant
- **Option B:** Nutze den API-Proxy (wie in dieser Anleitung beschrieben)

Die API-Proxy Methode aus dieser Anleitung umgeht dieses Problem automatisch!

### Problem: Dashboard zeigt keine Daten

**Prüfe Schritt für Schritt:**

1. **Browser Developer Tools öffnen** (F12)
   - Tab "Console" / "Konsole" öffnen
   - Gibt es Fehler (rot)?

2. **Netzwerk-Tab prüfen:**
   - Aktualisiere die Seite
   - Siehst du Anfragen zu `/api/states`?
   - Welcher Status Code? (sollte 200 sein)

3. **Home Assistant erreichbar?**
   - Öffne in einem neuen Tab: `http://192.168.1.100:8123`
   - (Ersetze mit deiner HA-IP)
   - Kannst du dich einloggen?

4. **Admin-Bereich Konfiguration prüfen:**
   - Öffne: `https://ha-status.deine-domain.de/admin`
   - Zahnrad-Symbol → Konfiguration
   - URL sollte sein: `https://ha-status.deine-domain.de` (ohne `/api`!)
   - Token korrekt eingegeben?
   - "Verbindung testen" klicken

## Updates durchführen

Wenn du Änderungen am Code vornimmst oder Updates einspielst:

1. **Neuen Build erstellen:**
   ```bash
   cd /pfad/zu/HomeAssistant-Status
   npm run build
   ```

2. **Alte Dateien auf Server löschen** (optional, aber empfohlen):
   - Via FTP/SFTP alle Dateien im Zielordner löschen
   - NICHT den Ordner selbst löschen!

3. **Neue Dateien hochladen:**
   - Wie in Schritt 2 beschrieben
   - Überschreibe alle bestehenden Dateien

4. **Browser Cache leeren:**
   - Strg + Shift + R (Windows/Linux)
   - Cmd + Shift + R (macOS)
   - Oder: Strg + Shift + Delete → "Zwischengespeicherte Bilder und Dateien"

## Zusammenfassung

Du hast erfolgreich:
- ✅ Einen Production Build erstellt
- ✅ Die Dateien auf deinen Server hochgeladen
- ✅ Nginx Proxy Manager konfiguriert
- ✅ Home Assistant CORS-Einstellungen angepasst
- ✅ Das Dashboard getestet

**Dein Dashboard ist jetzt:**
- 🌐 Öffentlich unter `https://ha-status.deine-domain.de` erreichbar
- 🔒 Admin-Bereich nur lokal zugänglich
- 🔐 Mit SSL verschlüsselt
- 🚀 Production-ready!

## Weitere Hilfe

Falls du trotz dieser Anleitung auf Probleme stößt:

1. **Prüfe die Logs:**
   - Nginx Proxy Manager: Proxy Host → drei Punkte → "View Logs"
   - Home Assistant: Einstellungen → System → Logs

2. **Erstelle ein Issue:**
   - Auf GitHub im Repository
   - Beschreibe das Problem
   - Füge Screenshots/Logs bei

3. **Community Fragen:**
   - Home Assistant Forum
   - Reddit r/homeassistant

Viel Erfolg mit deinem Home Assistant Status Dashboard!
