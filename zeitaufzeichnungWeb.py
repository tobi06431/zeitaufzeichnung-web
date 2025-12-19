#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, render_template, request, send_file, redirect, url_for, flash
from datetime import date
import re
import tempfile
import os

from pdf_service import create_pdf
from mail_service import send_pdf_mail  # <<< Mail-Versand

app = Flask(__name__)

# Für Flash-Messages (bei Render später als ENV setzen!)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret")


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        form_data = dict(request.form)

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
    )


if __name__ == "__main__":
    app.run(debug=True)
