# E-Mail-Konfiguration für Passwort-Reset

Um die Passwort-Reset-Funktion zu nutzen, müssen SMTP-Zugangsdaten konfiguriert werden.

## Option 1: Gmail (Empfohlen für Tests)

### 1. App-Passwort erstellen
1. Gehe zu https://myaccount.google.com
2. **Sicherheit** → **2-Faktor-Authentifizierung** (muss aktiviert sein)
3. **App-Passwörter** → **App auswählen** → "Mail" → **Gerät auswählen** → "Andere" → "Zeitaufzeichnung"
4. Kopiere das 16-stellige Passwort

### 2. Umgebungsvariablen auf Render setzen

Im Web Service → **Environment** Tab:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=deine-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx (App-Passwort)
```

## Option 2: SendGrid (Professionell)

### 1. SendGrid Account erstellen
1. Gehe zu https://sendgrid.com
2. Erstelle kostenlosen Account (100 E-Mails/Tag)
3. **Settings** → **API Keys** → **Create API Key**
4. Kopiere den API Key

### 2. Umgebungsvariablen auf Render setzen

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=dein-sendgrid-api-key
```

## Option 3: Pfarrei-E-Mail-Server

Falls eure Pfarrei einen eigenen E-Mail-Server hat:

```
SMTP_HOST=mail.example.com
SMTP_PORT=587
SMTP_USER=zeitaufzeichnung@pfarrei.de
SMTP_PASSWORD=dein-email-passwort
```

## Testen

Nach dem Setzen der Variablen:
1. Redeploy abwarten
2. Passwort-Reset-Funktion testen
3. Bei Fehlern: Render-Logs prüfen

## Wichtig

- **Verwende nie dein echtes Gmail-Passwort** → Nur App-Passwörter!
- **E-Mail-Adresse muss verifiziert sein** (bei Gmail/SendGrid)
- **2FA muss aktiviert sein** (bei Gmail)

## Alternative ohne E-Mail

Wenn E-Mail nicht konfiguriert ist, können Admins Passwörter manuell zurücksetzen:

In der Render-Shell:
```python
python3 -c "
from users import reset_password, get_user_by_username
user = get_user_by_username('benutzername')
if user:
    reset_password(user.id, 'NeuesPasswort123')
    print('✅ Passwort geändert')
"
```
