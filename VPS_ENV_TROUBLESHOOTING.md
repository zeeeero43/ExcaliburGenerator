# VPS Environment Variable Troubleshooting

## Das Problem
`echo $DEEPL_API_KEY` zeigt leer an, obwohl .env Datei erstellt wurde.

## Schritt-für-Schritt Lösung

### 1. .env Datei prüfen
```bash
# Prüfen ob .env existiert
ls -la .env

# Inhalt der .env anzeigen
cat .env

# Falls leer oder falsch - nochmal bearbeiten
nano .env
```

### 2. Systemd Service konfigurieren
Der Service muss die .env Datei laden. Service-Datei prüfen:

```bash
# Service-Konfiguration anzeigen
sudo systemctl cat excalibur-cuba

# Service-Datei bearbeiten
sudo nano /etc/systemd/system/excalibur-cuba.service
```

Service sollte so aussehen:
```ini
[Unit]
Description=Excalibur Cuba Website
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/excalibur-cuba
EnvironmentFile=/var/www/excalibur-cuba/.env
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**WICHTIG:** Die Zeile `EnvironmentFile=/var/www/excalibur-cuba/.env` muss drin sein!

### 3. Service neu laden und starten
```bash
# Service-Konfiguration neu laden
sudo systemctl daemon-reload

# Service neu starten
sudo systemctl restart excalibur-cuba

# Status prüfen
sudo systemctl status excalibur-cuba

# Logs anschauen
sudo journalctl -u excalibur-cuba -f
```

### 4. Environment Variable testen
```bash
# In der Shell wird $DEEPL_API_KEY immer noch leer sein
echo $DEEPL_API_KEY

# Aber der Service sollte ihn laden - Test mit:
sudo systemctl show excalibur-cuba --property=Environment
```

### 5. Alternative: Environment direkt in Service setzen
Falls EnvironmentFile nicht funktioniert:

```bash
sudo nano /etc/systemd/system/excalibur-cuba.service
```

Hinzufügen:
```ini
Environment=DEEPL_API_KEY=dein-api-key-hier
```

Dann:
```bash
sudo systemctl daemon-reload
sudo systemctl restart excalibur-cuba
```