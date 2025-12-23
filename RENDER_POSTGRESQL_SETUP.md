# PostgreSQL Setup auf Render

## 1. PostgreSQL-Datenbank erstellen

1. Gehe zu https://dashboard.render.com
2. Klicke **"New +"** → **"PostgreSQL"**
3. Konfiguration:
   - **Name:** `zeitaufzeichnung-db`
   - **Database:** `zeitaufzeichnung` (oder beliebig)
   - **User:** `zeitaufzeichnung_user` (oder beliebig)
   - **Region:** Frankfurt (oder nächstgelegene)
   - **Plan:** Free
4. Klicke **"Create Database"**
5. **Warte ca. 1 Minute** bis die Datenbank bereit ist

## 2. Datenbank mit Web Service verbinden

1. Gehe zu deinem **Web Service** (`zeitaufzeichnung-web`)
2. Klicke auf **"Environment"** Tab
3. Klicke **"Add Environment Variable"**
4. Füge hinzu:
   - **Key:** `DATABASE_URL`
   - **Value:** Gehe zurück zur PostgreSQL-Datenbank → Kopiere **"Internal Database URL"**
5. Klicke **"Save Changes"**

Der Service wird automatisch neu deployen.

## 3. Datenbank initialisieren

Nach dem Deploy:
1. Gehe zum **Web Service** → **"Shell"** Tab
2. Führe aus:
   ```bash
   python3 -c "from users import init_db; init_db(); print('✅ Datenbank bereit')"
   ```

## 4. Ersten Admin erstellen

In der Shell:
```bash
python3 create_user.py
```

Dann:
- Benutzername eingeben
- E-Mail eingeben
- Starkes Passwort
- Pfarrei wählen
- Bei "Admin-Rechte vergeben?" → **j** eingeben

## ✅ Fertig!

**Ab jetzt:**
- ✅ Alle Benutzer bleiben bei Updates erhalten
- ✅ PostgreSQL läuft persistent
- ✅ Lokal läuft weiter SQLite (für Tests)

**Wichtig:** Die alte `users.db` (SQLite) wird nicht mehr verwendet. Alle neuen Daten sind in PostgreSQL.
