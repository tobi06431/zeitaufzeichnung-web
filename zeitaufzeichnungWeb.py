#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Dec 15 18:59:52 2025

@author: tobiaslassmann
"""

#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, render_template, request, send_file
from datetime import date
import tempfile
import os

from pdf_service import create_pdf

app = Flask(__name__)


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        form_data = dict(request.form)

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
    app.run()
