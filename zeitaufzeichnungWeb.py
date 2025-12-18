from flask import Flask, render_template, request, send_file, redirect, url_for, flash
from datetime import date
import tempfile
import os

from pdf_service import create_pdf
from mail_service import send_pdf_mail   # <<< NEU

app = Flask(__name__)
app.secret_key = "dev-secret"  # für flash-Messages


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        form_data = dict(request.form)

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        tmp.close()

        create_pdf(form_data, tmp.name)

        # 👉 Wurde der Mail-Button gedrückt?
        if form_data.get("action") == "send_mail":
            send_pdf_mail(
                pdf_path=tmp.name,
                recipient="tobi06431@gmail.com"
            )

            os.remove(tmp.name)

            flash("PDF wurde erfolgreich an die Verwaltung gesendet.")
            return redirect(url_for("index"))

        # 👉 normaler Download
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
    app.run(debug=True)
