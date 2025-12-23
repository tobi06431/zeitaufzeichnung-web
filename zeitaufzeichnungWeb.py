#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, render_template, request, send_file, redirect, url_for, flash
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_wtf.csrf import CSRFProtect
from datetime import date
import re
import tempfile
import os

from pdf_service import create_pdf
from mail_service import send_pdf_mail, send_csv_mail  # <<< Mail-Versand
from users import init_db, get_user_by_id, get_user_by_username, verify_password
import csv

app = Flask(__name__)

# Für Flash-Messages (bei Render später als ENV setzen!)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret")

# Sichere Session-Einstellungen
app.config['SESSION_COOKIE_SECURE'] = True  # Nur über HTTPS (in Production)
app.config['SESSION_COOKIE_HTTPONLY'] = True  # Kein JavaScript-Zugriff
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # CSRF-Schutz
app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 Stunde

# CSRF-Schutz
csrf = CSRFProtect(app)

# Rate Limiting (Brute-Force-Schutz)
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Flask-Login Setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Bitte melde dich an, um fortzufahren.'

# Datenbank initialisieren
init_db()


@login_manager.user_loader
def load_user(user_id):
    return get_user_by_id(int(user_id))


@app.route("/login", methods=["GET", "POST"])
@limiter.limit("5 per minute")  # Max 5 Login-Versuche pro Minute
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        
        user = verify_password(username, password)
        
        if user:
            login_user(user)
            flash(f"✅ Willkommen, {user.username}!")
            return redirect(url_for("index"))
        else:
            flash("❌ Falscher Benutzername oder Passwort.")
    
    return render_template("login.html")


@app.route("/logout")
@login_required
def logout():
    logout_user()
    flash("✅ Du wurdest erfolgreich abgemeldet.")
    return redirect(url_for("login"))


@app.route("/", methods=["GET", "POST"])
@login_required
def index():
    if request.method == "POST":
        form_data = dict(request.form)
        action = request.form.get('action')

        # CSV senden (kein PDF nötig)
        if action == 'send_csv':
            fields = list(request.form.keys())
            # create temp csv
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".csv", mode='w', newline='', encoding='utf-8')
            try:
                writer = csv.writer(tmp)
                writer.writerow(fields)
                writer.writerow([request.form.get(k, '') for k in fields])
                tmp.close()

                # build filename similar to PDF naming but with .csv
                def _make_csv_filename(data):
                    ln = (data.get('Nachname') or '').strip().upper().replace(' ', '_')
                    fn = (data.get('Vorname') or '').strip().upper().replace(' ', '_')
                    mj = (data.get('Monat/Jahr') or '').strip()
                    m = None; y = None
                    mobj = re.match(r'^(\d{2})\/(\d{4})$', mj)
                    if mobj:
                        m = mobj.group(1)
                        y = mobj.group(2)
                    else:
                        today = date.today()
                        m = f"{today.month:02d}"
                        y = f"{today.year}"

                    def _clean(s):
                        return re.sub(r'[^A-Z0-9_,\-\.]', '_', s)

                    ln = _clean(ln) or 'UNKNOWN'
                    fn = _clean(fn) or 'UNKNOWN'

                    return f"{ln},{fn},{y},{m}.csv"

                csv_filename = _make_csv_filename(form_data)

                send_csv_mail(csv_path=tmp.name, recipient=os.environ.get("MAIL_TO", "tobi06431@gmail.com"), filename=csv_filename)
                try:
                    os.remove(tmp.name)
                except OSError:
                    pass

                flash("✅ CSV wurde erfolgreich an die Verwaltung gesendet.")
                return redirect(url_for("index"))
            except Exception as e:
                try:
                    tmp.close()
                except Exception:
                    pass
                try:
                    os.remove(tmp.name)
                except Exception:
                    pass
                flash(f"❌ Fehler beim CSV-Versand: {e}")
                return redirect(url_for("index"))

        # PDF temporär erzeugen
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        tmp.close()

        try:
            create_pdf(form_data, tmp.name)

            # build desired filename: NACHNAME,VORNAME,JAHR,MONAT
            def _make_pdf_filename(data):
                ln = (data.get('Nachname') or '').strip().upper().replace(' ', '_')
                fn = (data.get('Vorname') or '').strip().upper().replace(' ', '_')
                mj = (data.get('Monat/Jahr') or '').strip()
                m = None; y = None
                mobj = re.match(r'^(\d{2})\/(\d{4})$', mj)
                if mobj:
                    m = mobj.group(1)
                    y = mobj.group(2)
                else:
                    today = date.today()
                    m = f"{today.month:02d}"
                    y = f"{today.year}"

                # sanitize simple: allow A-Z0-9,_ and commas (we already uppercased and replaced spaces)
                def _clean(s):
                    return re.sub(r'[^A-Z0-9_,\-\.]', '_', s)

                ln = _clean(ln) or 'UNKNOWN'
                fn = _clean(fn) or 'UNKNOWN'

                return f"{ln},{fn},{y},{m}.pdf"

            pdf_filename = _make_pdf_filename(form_data)

            # 👉 Wurde der Mail-Button gedrückt?
            if form_data.get("action") == "send_mail":
                send_pdf_mail(
                    pdf_path=tmp.name,
                    recipient=os.environ.get("MAIL_TO", "tobi06431@gmail.com"),
                    filename=pdf_filename,
                )

                # Temp-PDF entfernen
                try:
                    os.remove(tmp.name)
                except OSError:
                    pass

                flash("✅ PDF wurde erfolgreich an die Verwaltung gesendet.")
                return redirect(url_for("index"))

            # 👉 normaler Download
            response = send_file(
                tmp.name,
                as_attachment=True,
                download_name=pdf_filename,
            )

            # Temp-Datei nach dem Response löschen
            @response.call_on_close
            def cleanup():
                try:
                    os.remove(tmp.name)
                except OSError:
                    pass

            return response

        except Exception as e:
            # bei Fehler: Temp-Datei entfernen + Fehlermeldung anzeigen
            try:
                os.remove(tmp.name)
            except OSError:
                pass

            flash(f"❌ Fehler: {e}")
            return redirect(url_for("index"))

    return render_template(
        "form.html",
        today=date.today().strftime("%d.%m.%Y"),
        user_pfarrei=current_user.pfarrei,
        username=current_user.username,
    )


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
