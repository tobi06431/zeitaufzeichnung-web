# 🛡️ Datensicherung & Schutz vor Datenverlust

## 📊 Aktuelle Datensicherheit

### ✅ Was bereits geschützt ist:

1. **PostgreSQL auf Render.com (Production)**
   - Automatische tägliche Backups (7 Tage Aufbewahrung im Free Tier)
   - Point-in-Time Recovery möglich
   - Hochverfügbare Infrastruktur
   - Automatische Replikation

2. **SQLite (Lokale Entwicklung)**
   - Datei-basiert: `users.db`
   - Kann einfach kopiert werden
   - Git-ignoriert (nicht im Repository)

3. **Sichere Migrations**
   - `apply_migrations.py` mit Rollback bei Fehlern
   - SQL-Dateien versioniert in `migrations/`
   - Transaktionssicherheit

4. **Code-Sicherheit**
   - Alle Änderungen in Git versioniert
   - GitHub als Remote-Backup
   - Historie aller Commits verfügbar

## 🔧 Manuelles Backup erstellen

### Vor jedem größeren Update:

```bash
# 1. Backup erstellen
python3 backup_database.py

# Oder mit eigenem Dateinamen:
python3 backup_database.py backup pre_update_backup.json
```

Das erstellt eine JSON-Datei mit **allen** Daten:
- Benutzer (ohne Passwörter)
- Profile
- Timerecords (Entwürfe)
- Submissions (eingereichte Daten)

### Backup-Dateien sichern:

```bash
# Lokal auf anderem Laufwerk speichern
cp backup_*.json ~/Backups/

# Oder in Cloud hochladen (Dropbox, Google Drive, etc.)
```

## 🚀 Sicheres Update-Verfahren

### Schritt-für-Schritt Anleitung:

```bash
# 1. BACKUP ERSTELLEN
python3 backup_database.py backup vor_update_$(date +%Y%m%d).json

# 2. Code-Änderungen testen (lokal mit SQLite)
# - Teste alle Funktionen
# - Prüfe auf Fehler

# 3. Migrations vorbereiten (falls DB-Änderungen nötig)
# - Erstelle neue SQL-Datei in migrations/
# - Beispiel: migrations/002_neue_spalte.sql

# 4. Migration lokal testen
python3 apply_migrations.py

# 5. Wenn alles funktioniert: Deploy
git add .
git commit -m "Update: Beschreibung"
git push origin main

# 6. Auf Render.com wird automatisch deployed
# 7. Migrations laufen automatisch beim Start
```

## 💾 Render.com PostgreSQL Backups

### Automatische Backups (Free Tier):
- **Frequenz:** Täglich
- **Aufbewahrung:** 7 Tage
- **Zugriff:** Über Render Dashboard → Database → Backups

### Manuelles Backup auf Render:
```bash
# Im Render Dashboard:
# 1. Database auswählen
# 2. "Backups" Tab
# 3. "Create Backup" klicken
```

### Backup herunterladen:
```bash
# PostgreSQL pg_dump (falls Zugriff auf DB-URL)
pg_dump $DATABASE_URL > backup.sql
```

## 🔄 Migrations sicher anwenden

### Best Practices:

1. **Immer rückwärtskompatibel**
   - Neue Spalten mit DEFAULT-Werten
   - Keine Spalten löschen (erst als deprecated markieren)

2. **Transaktionssicherheit**
   - Migrations werden in Transaktionen ausgeführt
   - Bei Fehler: Automatischer Rollback

3. **Testing**
   - Lokal testen mit SQLite
   - Dann auf Render mit kleinem Testdatensatz

## 🆘 Notfall-Wiederherstellung

### Wenn Daten verloren gehen:

```bash
# 1. Backup-Datei bereithalten
# 2. Daten manuell überprüfen
python3 -c "import json; print(json.load(open('backup_DATUM.json', 'r'))['statistics'])"

# 3. Render PostgreSQL zurücksetzen (im Dashboard)
# 4. Daten aus Backup manuell wiederherstellen
#    (oder Support kontaktieren)
```

### Bei Code-Problemen:

```bash
# Zu vorherigem funktionierenden Commit zurück
git log --oneline  # Commit finden
git revert <commit-hash>  # Oder:
git reset --hard <commit-hash>
git push origin main --force
```

## 📋 Checkliste vor jedem Update

- [ ] Backup erstellt mit `python3 backup_database.py`
- [ ] Backup-Datei gesichert (lokal + Cloud)
- [ ] Änderungen lokal getestet
- [ ] Alle Tests erfolgreich (`pytest`)
- [ ] Git commit mit aussagekräftiger Message
- [ ] Migration-SQL geprüft (falls vorhanden)
- [ ] Dokumentation aktualisiert

## 🔐 Zusätzliche Sicherheitsmaßnahmen

### Empfohlene Ergänzungen:

1. **Regelmäßige automatische Backups**
   - Cron-Job auf lokalem Server
   - GitHub Actions für wöchentliche Backups
   - Cloud-Speicher Integration

2. **Monitoring**
   - Render.com Logs überwachen
   - Error-Tracking (z.B. Sentry)
   - Uptime-Monitoring

3. **Disaster Recovery Plan**
   - Dokumentierte Wiederherstellungsschritte
   - Test-Restore durchführen
   - Kontaktinformationen für Notfall

## 📞 Hilfe & Support

Bei Problemen:
1. Render.com Support kontaktieren (im Dashboard)
2. GitHub Issues erstellen
3. Backup-Dateien aufbewahren!

## 🎯 Zusammenfassung

**Deine Daten sind geschützt durch:**
- ✅ Automatische tägliche Backups (Render)
- ✅ Manuelles Backup-Script (`backup_database.py`)
- ✅ Git-Versionierung
- ✅ Transaktionssichere Migrations
- ✅ Rollback-Mechanismen

**Vor jedem Update:**
```bash
python3 backup_database.py
# Backup-Datei sichern
# Dann erst deployen
```

**Risiko eines Datenverlusts:** Sehr gering! 🎉
