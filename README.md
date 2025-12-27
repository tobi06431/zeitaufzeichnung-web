# Zeitaufzeichnung Web

Web-basierte Zeitaufzeichnungs-Anwendung für kirchliche Mitarbeiter zur Erfassung von Arbeitszeiten und Gottesdiensten.

## Features

✅ **Zeiterfassung**
- Arbeitszeiten mit Datum, Beginn und Ende
- Gottesdienst-Erfassung mit Kirchort, Datum und Honorarsatz
- Automatische Stundenberechnung (inkl. Nachtschichten)
- Monatsweise Organisation

✅ **Moderne Benutzeroberfläche**
- Responsive Design für Desktop und Mobile
- Live-Zusammenfassung des Erfassungsstatus
- Automatische Speicherung (alle 2 Sekunden + 30 Sekunden Interval)
- Funktioniert auch im Privat-Modus

✅ **Multi-User & Admin**
- Benutzer-Registrierung mit E-Mail-Verifizierung
- Passwort-Reset-Funktion
- Admin-Dashboard zur Verwaltung aller Zeitaufzeichnungen
- Möglichkeit Einträge als Admin zu löschen

✅ **Datenpersistenz**
- Server-basierte Speicherung (PostgreSQL in Production)
- Automatische Synchronisation zwischen Geräten
- Zeitstempel-basierte Konfliktvermeidung

## Technologie-Stack

**Backend:**
- Python 3.x
- Flask 3.x
- PostgreSQL (Production) / SQLite (Entwicklung)
- bcrypt für Passwort-Hashing

**Frontend:**
- Vanilla JavaScript (modulare Architektur)
- CSS3 mit modernem Design
- Keine externen Frameworks

## Installation & Entwicklung

### Voraussetzungen
```bash
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

### Lokale Entwicklung
```bash
python zeitaufzeichnungWeb.py
```
App läuft auf `http://localhost:5000`

### Umgebungsvariablen (Production)
```bash
DATABASE_URL=postgresql://user:pass@host:port/db
SECRET_KEY=your-secret-key
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

## Deployment (Render.com)

1. Repository auf GitHub pushen
2. Render.com Dashboard → "New Web Service"
3. Repository verbinden
4. Umgebungsvariablen setzen
5. Build Command: `pip install -r requirements.txt`
6. Start Command: `gunicorn zeitaufzeichnungWeb:app`

PostgreSQL-Datenbank wird automatisch erstellt.

## Projekt-Struktur

```
zeitaufzeichnung_web/
├── zeitaufzeichnungWeb.py    # Haupt-App & Routen
├── users.py                  # Datenbank-Logik & User-Management
├── mail_service.py           # E-Mail-Versand
├── pdf_service.py            # PDF-Generierung
├── utils.py                  # Hilfsfunktionen
├── requirements.txt          # Python-Abhängigkeiten
├── templates/                # HTML-Templates
│   ├── form.html            # Haupt-Erfassungsformular
│   ├── admin.html           # Admin-Dashboard
│   └── ...
├── static/                   # Frontend-Assets
│   ├── style.css            # Haupt-Stylesheet
│   ├── app.init.js          # Initialisierung
│   └── lib/                 # Modulare JS-Dateien
│       ├── storage.js       # Server-Kommunikation
│       ├── gd.js            # Gottesdienst-Logik
│       ├── arbeitszeiten.js # Arbeitszeit-Logik
│       └── ui.js            # UI-Rendering
└── migrations/              # Datenbank-Migrationen
    └── 001_add_indices.sql
```

## Sicherheit

- ✅ CSRF-Schutz auf allen POST-Routen
- ✅ Passwort-Hashing mit bcrypt
- ✅ E-Mail-Verifizierung bei Registrierung
- ✅ Session-basierte Authentifizierung
- ✅ SQL-Injection-Schutz durch parametrisierte Queries

## Lizenz

Proprietär - Alle Rechte vorbehalten

## Kontakt

Bei Fragen oder Support-Anfragen bitte an: [Kontakt-Info]
