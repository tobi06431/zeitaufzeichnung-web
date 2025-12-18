import smtplib
from email.message import EmailMessage
import os

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587

SMTP_USER = "DEINE_TESTMAIL@gmail.com"
SMTP_PASSWORD = "APP_PASSWORT_HIER"


def send_pdf_mail(pdf_path: str, recipient: str):
    msg = EmailMessage()
    msg["Subject"] = "Zeitaufzeichnung – Formular"
    msg["From"] = SMTP_USER
    msg["To"] = recipient

    msg.set_content(
        "Im Anhang befindet sich das ausgefüllte Formular zur Zeitaufzeichnung."
    )

    with open(pdf_path, "rb") as f:
        pdf_data = f.read()

    msg.add_attachment(
        pdf_data,
        maintype="application",
        subtype="pdf",
        filename=os.path.basename(pdf_path),
    )

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
