# Admin-Dashboard Authentifizierung mit HTTP Basic Auth

Diese Anleitung zeigt, wie du das Admin-Dashboard (`/adminDashboard`) mit HTTP Basic Auth über Nginx Proxy Manager schützt, sodass es auch aus dem Internet sicher erreichbar ist.

## 🔐 Sicherheitskonzept

```
┌─────────────────────────────────────────────────────────────┐
│ /                    - Öffentliches Dashboard               │
│ ✅ Für alle erreichbar                                      │
│ 🔒 Nur Anzeige (Read-Only)                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ /admin               - Admin-Konfiguration                  │
│ 🔒 NUR lokal (IP-Whitelist)                                 │
│ ❌ NICHT aus dem Internet erreichbar                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ /adminDashboard      - Admin-Dashboard mit Steuerung        │
│ 🔒 Passwortgeschützt (HTTP Basic Auth)                      │
│ 🌐 Aus dem Internet erreichbar (mit Login)                  │
│ 🔐 Username + Passwort erforderlich                         │
└─────────────────────────────────────────────────────────────┘
```

## ⚙️ Nginx Proxy Manager Setup

### Schritt 1: Access List erstellen

1. **Öffne Nginx Proxy Manager** (normalerweise `http://dein-server:81`)
2. Gehe zu **"Access Lists"** im Menü
3. Klicke auf **"Add Access List"**

#### Details Tab:
- **Name**: `HA Admin Dashboard Auth`
- **Satisfy Any**: ✅ Aktiviert (wichtig!)
- **Pass Auth to Host**: ❌ Deaktiviert

#### Authorization Tab:
1. Klicke auf **"Add User"**
2. **Username**: `admin` (oder dein gewünschter Username)
3. **Password**: Wähle ein **starkes Passwort**
   - Mindestens 16 Zeichen
   - Groß-/Kleinbuchstaben, Zahlen, Sonderzeichen
   - Beispiel-Generator: https://www.random.org/passwords/

4. Klicke **"Save"**

**Wichtig:** Speichere Username und Password sicher (z.B. in einem Passwort-Manager)!

#### Access Tab:
Hier kannst du optional IP-Adressen für Zugriff OHNE Passwort whitelisten:

```
# Beispiel: Lokales Netzwerk ohne Passwort
allow 192.168.1.0/24;

# Beispiel: Deine feste externe IP ohne Passwort
allow 1.2.3.4;
```

**Falls du "Satisfy Any" aktiviert hast:**
- Whitelisted IPs → **Kein** Passwort nötig
- Andere IPs → Passwort **erforderlich**

5. Klicke **"Save"**

---

### Schritt 2: Proxy Host konfigurieren

#### Variante A: Neue Proxy Host Konfiguration

1. Gehe zu **"Hosts"** → **"Proxy Hosts"**
2. Wähle deinen bestehenden Proxy Host aus (z.B. `ha-status.deine-domain.de`)
3. Klicke auf die **drei Punkte** → **"Edit"**

#### Tab: Details
(Keine Änderungen nötig, bleibt wie gehabt)

#### Tab: SSL
(Keine Änderungen nötig, SSL sollte bereits aktiviert sein)

#### Tab: Advanced

Ersetze die bisherige Custom Nginx Configuration mit dieser erweiterten Version:

```nginx
# Admin-Bereich NUR lokal (IP-basiert)
location ~ ^/admin$ {
    # Nur lokales Netzwerk (PASSE DIES AN!)
    allow 192.168.1.0/24;     # Dein lokales Netzwerk
    allow 127.0.0.1;
    deny all;

    try_files $uri $uri/ /index.html;
    error_page 403 = @forbidden;
}

# Admin-Dashboard mit HTTP Basic Auth (aus Internet erreichbar)
location /adminDashboard {
    # HTTP Basic Auth aktivieren
    auth_basic "Admin-Dashboard";
    auth_basic_user_file /data/nginx/custom/htpasswd_ha_admin;

    # Optional: Zusätzlich lokales Netzwerk ohne Passwort
    satisfy any;
    allow 192.168.1.0/24;     # Dein lokales Netzwerk
    deny all;

    try_files $uri $uri/ /index.html;
}

# 403 → 404 umleiten (Security through obscurity)
location @forbidden {
    return 404;
}

# API Proxy zu Home Assistant
location /api {
    proxy_pass http://192.168.12.181:8123;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # WebSocket Support
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    # CORS Headers
    add_header Access-Control-Allow-Origin "https://ha-status.deine-domain.de" always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
    add_header Access-Control-Allow-Credentials "true" always;

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

**WICHTIG:** Passe die IP-Ranges (`192.168.1.0/24`) an dein eigenes Netzwerk an!

4. Klicke **"Save"**

---

### Schritt 3: Access List mit Proxy Host verknüpfen

1. Bearbeite deinen Proxy Host erneut
2. Gehe zum **"Details"** Tab
3. Scrolle nach unten zu **"Access List"**
4. Wähle die erstellte Access List: `HA Admin Dashboard Auth`
5. Klicke **"Save"**

---

### Schritt 4: htpasswd Datei erstellen (Manuelle Methode)

**Falls die Access List nicht funktioniert**, erstelle die Passwort-Datei manuell:

#### Auf dem Server (per SSH):

```bash
# 1. Verzeichnis erstellen
sudo mkdir -p /data/nginx/custom

# 2. htpasswd installieren (falls nicht vorhanden)
# Debian/Ubuntu:
sudo apt-get install apache2-utils

# CentOS/Rocky:
sudo yum install httpd-tools

# 3. Passwort-Datei erstellen
sudo htpasswd -c /data/nginx/custom/htpasswd_ha_admin admin

# Es wird nach dem Passwort gefragt
# Gib ein starkes Passwort ein

# 4. Weitere User hinzufügen (optional, OHNE -c Flag!)
sudo htpasswd /data/nginx/custom/htpasswd_ha_admin user2

# 5. Berechtigungen setzen
sudo chmod 644 /data/nginx/custom/htpasswd_ha_admin
sudo chown root:root /data/nginx/custom/htpasswd_ha_admin
```

#### Datei-Inhalt prüfen:
```bash
cat /data/nginx/custom/htpasswd_ha_admin
```

Ausgabe sollte sein:
```
admin:$apr1$xyz12345$abcdefghijklmnop
```

---

## 🧪 Testing

### Test 1: Admin-Konfiguration (nur lokal)

**Von deinem lokalen Netzwerk:**
```
URL: https://ha-status.deine-domain.de/admin
Erwartung: ✅ Seite lädt ohne Passwort
```

**Von außerhalb (Mobile Daten):**
```
URL: https://ha-status.deine-domain.de/admin
Erwartung: ❌ 404 Fehler (Seite nicht gefunden)
```

---

### Test 2: Admin-Dashboard (passwortgeschützt)

**Von deinem lokalen Netzwerk (mit satisfy any):**
```
URL: https://ha-status.deine-domain.de/adminDashboard
Erwartung: ✅ Seite lädt OHNE Passwort (weil IP whitelisted)
```

**Von außerhalb (Mobile Daten, VPN aus):**
```
URL: https://ha-status.deine-domain.de/adminDashboard
Erwartung: 🔐 Browser fragt nach Username/Passwort
Nach Eingabe: ✅ Seite lädt
```

---

### Test 3: Öffentliches Dashboard

**Von überall:**
```
URL: https://ha-status.deine-domain.de/
Erwartung: ✅ Seite lädt ohne Passwort
```

---

## 🔒 Sicherheits-Best-Practices

### 1. Starkes Passwort verwenden

**Schlecht:**
```
admin
12345678
passwort
```

**Gut:**
```
K9$mPz#vL2@qR8nX4wY7
Haus!Assistent#2024$Sicher
Kj8#mN2$pQ9@rT5vX
```

Generator: https://www.random.org/passwords/?num=1&len=24&format=html&rnd=new

---

### 2. HTTPS immer aktivieren

```nginx
# In NPM SSL Tab:
✅ Force SSL
✅ HTTP/2 Support
✅ HSTS Enabled
```

---

### 3. Zusätzliche Nginx Security Headers

Füge in "Advanced" Tab hinzu:

```nginx
# Security Headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

---

### 4. Rate Limiting (Brute-Force-Schutz)

Optional in "Advanced" Tab:

```nginx
# Rate Limiting für /adminDashboard
limit_req_zone $binary_remote_addr zone=admin_limit:10m rate=5r/m;

location /adminDashboard {
    limit_req zone=admin_limit burst=10 nodelay;

    # ... rest der config
}
```

Das erlaubt nur 5 Requests pro Minute pro IP.

---

## 🔐 Passwort ändern

### Über htpasswd (empfohlen):

```bash
# Auf dem Server
sudo htpasswd /data/nginx/custom/htpasswd_ha_admin admin

# Neues Passwort eingeben
```

### User löschen:

```bash
sudo htpasswd -D /data/nginx/custom/htpasswd_ha_admin username
```

---

## 🆘 Troubleshooting

### Problem: 401 Unauthorized trotz korrektem Passwort

**Lösung:**
```bash
# Prüfe Berechtigungen
ls -la /data/nginx/custom/htpasswd_ha_admin

# Sollte sein: -rw-r--r-- root root
# Falls nicht:
sudo chmod 644 /data/nginx/custom/htpasswd_ha_admin
sudo chown root:root /data/nginx/custom/htpasswd_ha_admin

# Nginx Proxy Manager Container neu starten
docker restart nginx-proxy-manager
```

---

### Problem: Passwort-Abfrage im lokalen Netzwerk

**Ursache:** IP nicht whitelisted oder `satisfy any` fehlt

**Lösung:**
```nginx
location /adminDashboard {
    satisfy any;              # ← Wichtig!
    allow 192.168.1.0/24;     # ← Dein Netzwerk
    deny all;

    auth_basic "Admin-Dashboard";
    auth_basic_user_file /data/nginx/custom/htpasswd_ha_admin;

    # ...
}
```

---

### Problem: Endlos-Login-Loop

**Ursache:** Browser cached falsche Credentials

**Lösung:**
1. Browser komplett schließen
2. Private/Inkognito-Fenster öffnen
3. Neu einloggen

Oder:
```bash
# Chrome/Edge
Einstellungen → Datenschutz → Browserdaten löschen → Passwörter

# Firefox
Einstellungen → Datenschutz → Cookies und Website-Daten → Daten entfernen
```

---

### Problem: 404 statt 401

**Ursache:** Nginx findet htpasswd-Datei nicht

**Lösung:**
```bash
# Prüfe ob Datei existiert
ls -la /data/nginx/custom/htpasswd_ha_admin

# Falls nicht, erstelle sie:
sudo htpasswd -c /data/nginx/custom/htpasswd_ha_admin admin
```

---

## 📱 Mobile App Support

HTTP Basic Auth funktioniert auf allen Plattformen:

- ✅ **iOS Safari** - Username/Passwort speicherbar
- ✅ **Android Chrome** - Username/Passwort speicherbar
- ✅ **Desktop Browser** - Username/Passwort speicherbar
- ✅ **Home Assistant App** - Webview mit Auth

**Tipp:** Speichere die Zugangsdaten im Browser, dann musst du sie nicht jedes Mal eingeben.

---

## 🔄 Logout

**HTTP Basic Auth hat keinen Logout-Button!**

Um dich "auszuloggen":
1. Browser-Tab schließen
2. Browser komplett beenden
3. Oder: Private/Inkognito-Modus verwenden

**Alternativ (Browser-Trick):**
```
# Falsches Passwort einloggen
Username: logout
Password: logout

# Browser vergisst alte Credentials
```

---

## 📊 Sicherheitslevel

Mit dieser Konfiguration erreichst du:

```
✅ HTTPS Verschlüsselung       → 🛡️🛡️🛡️🛡️🛡️
✅ HTTP Basic Auth              → 🛡️🛡️🛡️🛡️
✅ IP-Whitelist für /admin      → 🛡️🛡️🛡️🛡️
✅ Security Headers             → 🛡️🛡️🛡️
✅ Rate Limiting (optional)     → 🛡️🛡️🛡️

Gesamt: 🛡️🛡️🛡️🛡️ (Sehr gut!)
```

**Für ein Home-Dashboard ist das absolut ausreichend!**

---

## 🎯 Zusammenfassung

Nach dieser Einrichtung hast du:

| Route | Zugriff | Authentifizierung |
|-------|---------|-------------------|
| `/` | 🌐 Internet | Keine |
| `/admin` | 🏠 Nur lokal | IP-basiert |
| `/adminDashboard` | 🌐 Internet | Username + Passwort |

**Sicher, einfach, wartungsarm!** ✅
