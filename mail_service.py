import os
import smtplib
from email.message import EmailMessage


def _get_env(name: str) -> str:
    value = (os.getenv(name) or "").strip()
    if not value:
        raise RuntimeError(f"Fehlende Environment-Variable: {name}")
    return value


def send_pdf_mail(pdf_path: str, recipient: str, filename: str = None):
    smtp_host = (os.getenv("SMTP_HOST") or "smtp.gmail.com").strip()
    smtp_port = int((os.getenv("SMTP_PORT") or "587").strip())

    smtp_user = _get_env("SMTP_USER")
    smtp_password = _get_env("SMTP_PASSWORD")

    msg = EmailMessage()
    msg["Subject"] = "Zeitaufzeichnung – Formular"
    msg["From"] = smtp_user
    msg["To"] = recipient

    msg.set_content(
        "Hallo,\n\nanbei das automatisch erzeugte PDF-Formular.\n\nViele Grüße\nZeitaufzeichnung Web"
    )

    with open(pdf_path, "rb") as f:
        pdf_data = f.read()

    attach_name = filename or os.path.basename(pdf_path)

    msg.add_attachment(
        pdf_data,
        maintype="application",
        subtype="pdf",
        filename=attach_name,
    )

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
