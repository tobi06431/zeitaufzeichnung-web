#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, render_template, request, send_file
from datetime import date
import tempfile

from pdf_service import create_pdf

app = Flask(__name__)


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        # request.form ist ein ImmutableMultiDict -> wir wollen ein normales dict
        form_data = request.form.to_dict(flat=True)

        # Sicherheits-Fallback: falls das Hidden-Feld mal leer/fehlend ist
        # (z.B. alter Browser-Cache oder Template-Fehler)
        form_data.setdefault("Gottesdienste", "[]")

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        tmp.close()

        create_pdf(form_data, tmp.name)

        return send_file(
            tmp.name,
            as_attachment=True,
            download_name="Zeitaufzeichnung.pdf",
        )

    return render_template(
        "form.html",
        today=date.today().strftime("%d.%m.%Y"),
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
