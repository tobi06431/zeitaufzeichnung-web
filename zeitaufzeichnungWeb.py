#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, render_template, request, send_file, redirect, url_for, flash
from datetime import date
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

            # 👉 Wurde der Mail-Button gedrückt?
            if form_data.get("action") == "send_mail":
                send_pdf_mail(
                    pdf_path=tmp.name,
                    recipient=os.environ.get("MAIL_TO", "tobi06431@gmail.com"),
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
                download_name="Zeitaufzeichnung.pdf",
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
