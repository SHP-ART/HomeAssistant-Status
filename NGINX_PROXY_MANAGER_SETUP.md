# Nginx Proxy Manager Setup für Home Assistant Status Dashboard

## Szenario: Statusseite im Internet, Home Assistant nur intern

Diese Anleitung zeigt, wie du die Statusseite über das Internet erreichbar machst, während Home Assistant nur in deinem lokalen Netzwerk läuft.

## Architektur

```
Internet
   ↓
https://ha-status.deine-domain.de (Statusseite - öffentlich)
   ↓
Nginx Proxy Manager auf deinem Server
   ↓ (nur /api Anfragen werden weitergeleitet)
http://192.168.12.181:8123 (Home Assistant - intern)
```

## Setup in Nginx Proxy Manager

### 1. Proxy Host für die Statusseite erstellen

1. **Öffne Nginx Proxy Manager** (normalerweise http://dein-server:81)
2. Klicke auf **"Proxy Hosts"** → **"Add Proxy Host"**

#### Tab: Details
- **Domain Names**: `ha-status.deine-domain.de`
- **Scheme**: `http`
- **Forward Hostname / IP**: `localhost` (oder IP wo die Statusseite liegt)
- **Forward Port**: `80` (Port wo deine Statusseite gehostet wird)
- ✅ **Block Common Exploits**: aktiviert
- ✅ **Websockets Support**: aktiviert

#### Tab: SSL
- ✅ **SSL Certificate**: Wähle ein bestehendes oder erstelle eins mit Let's Encrypt
- **Email**: deine-email@example.com
- ✅ **Force SSL**: aktiviert
- ✅ **HTTP/2 Support**: aktiviert
- ✅ **HSTS Enabled**: aktiviert

#### Tab: Advanced

Füge folgende Custom Nginx Configuration hinzu:

```nginx
# API Proxy zu Home Assistant (nur intern erreichbar)
location /api {
    proxy_pass http://192.168.12.181:8123;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # WebSocket Support für Home Assistant
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    # CORS Headers - WICHTIG!
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

# Statische Dateien der React App
location / {
    try_files $uri $uri/ /index.html;

    # Cache für statische Assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

3. Klicke **"Save"**

### 2. Build und Deploy der Statusseite

#### Auf deinem lokalen Rechner:

```bash
# Production Build erstellen
npm run build

# dist Ordner auf deinen Server hochladen
# Ersetze die Werte entsprechend:
scp -r dist/* user@dein-server:/var/www/ha-status/

# Oder mit rsync:
rsync -avz dist/ user@dein-server:/var/www/ha-status/
```

#### Auf dem Server:

Stelle sicher, dass die Dateien im richtigen Verzeichnis liegen:
```bash
ls -la /var/www/ha-status/
# Du solltest index.html, assets/, etc. sehen
```

### 3. Home Assistant Konfiguration

In deiner Home Assistant `configuration.yaml`:

```yaml
http:
  # WICHTIG: Füge deine Domain hinzu, NICHT localhost!
  cors_allowed_origins:
    - "https://ha-status.deine-domain.de"

  # Optional: Vertrauenswürdige Proxies (wenn NPM auf anderem Server)
  use_x_forwarded_for: true
  trusted_proxies:
    - 192.168.12.0/24  # Dein lokales Netzwerk
```

Starte Home Assistant neu.

### 4. Statusseite Konfiguration anpassen

Da die API über `/api` auf der gleichen Domain erreichbar ist, muss die Statusseite wissen, dass sie einen relativen Pfad verwenden soll:

**In der Statusseite konfigurierst du:**
- **URL**: `https://ha-status.deine-domain.de` (OHNE /api am Ende!)

Die App wird automatisch `/api` anhängen.

## Alternative: Ohne API-Proxy (VPN erforderlich)

Falls du nicht möchtest, dass die Home Assistant API über den Proxy läuft:

1. **Verwende ein VPN** (z.B. Tailscale, WireGuard)
2. **Statusseite öffentlich** → für jeden zugänglich
3. **Home Assistant privat** → nur über VPN erreichbar
4. Benutzer müssen VPN aktivieren UND die interne HA-IP in der Statusseite eingeben

**Nachteil**: Nur du kannst die Statusseite nutzen (da nur du VPN-Zugriff hast)

## Sicherheitshinweise

⚠️ **WICHTIG**: Mit dem API-Proxy können Personen, die deine Statusseite erreichen, theoretisch auch auf deine Home Assistant API zugreifen, wenn sie deinen Access Token kennen.

**Sicherheitsmaßnahmen:**

1. ✅ **Token nicht teilen** - Gib deinen Access Token niemals weiter
2. ✅ **HTTPS verwenden** - Immer SSL aktivieren
3. ✅ **Firewall** - Nginx Proxy Manager sollte die einzige Verbindung nach außen sein
4. ✅ **IP-Whitelist** (Optional) - Beschränke den Zugriff auf bestimmte IPs:

```nginx
# In NPM Advanced Config hinzufügen
location /api {
    # Nur von bestimmten IPs erlauben
    allow 1.2.3.4;      # Deine feste IP
    deny all;

    # Rest der Config...
    proxy_pass http://192.168.12.181:8123;
    # ...
}
```

## Testing

1. **Öffne**: `https://ha-status.deine-domain.de`
2. **Konfigurationsmodal sollte erscheinen**
3. **Gib ein**:
   - URL: `https://ha-status.deine-domain.de`
   - Token: Dein Long-Lived Access Token
4. **Teste Verbindung**
5. Bei Erfolg: ✅ Dashboard sollte Daten anzeigen

## Troubleshooting

### CORS-Fehler trotz Konfiguration
- Überprüfe, ob die Domain in `cors_allowed_origins` exakt gleich ist (inkl. https://)
- Home Assistant neu starten
- Browser Cache leeren

### 502 Bad Gateway
- Überprüfe, ob Home Assistant erreichbar ist: `curl http://192.168.12.181:8123/api/`
- Nginx Proxy Manager Logs prüfen

### Mixed Content Warnings
- Stelle sicher, dass die Statusseite HTTPS verwendet
- Stelle sicher, dass die URL in der Config HTTPS ist

## Performance-Optimierung

```nginx
# In NPM Advanced Config
location /api {
    # Caching für API-Responses (optional, nur für Read-Only Daten)
    proxy_cache_bypass $http_upgrade;

    # Timeouts erhöhen für langsame Verbindungen
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Rest der Config...
}
```
