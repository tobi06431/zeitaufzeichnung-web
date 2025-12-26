import os
import smtplib
import logging
from email.message import EmailMessage

logger = logging.getLogger(__name__)


class MailServiceError(Exception):
    """Custom Exception für Mail-Service Fehler"""
    pass


def _get_env(name: str) -> str:
    value = (os.getenv(name) or "").strip()
    if not value:
        raise RuntimeError(f"Fehlende Environment-Variable: {name}")
    return value


def send_pdf_mail(pdf_path: str, recipient: str, filename: str = None) -> None:
    """
    Sendet PDF-Datei per E-Mail
    
    Args:
        pdf_path: Pfad zur PDF-Datei
        recipient: E-Mail-Empfänger (oder mehrere kommagetrennt)
        filename: Optionaler Dateiname für Anhang
        
    Raises:
        MailServiceError: Bei Fehlern beim E-Mail-Versand
    """
    try:
        smtp_host = (os.getenv("SMTP_HOST") or "smtp.gmail.com").strip()
        smtp_port = int((os.getenv("SMTP_PORT") or "587").strip())

        smtp_user = _get_env("SMTP_USER")
        smtp_password = _get_env("SMTP_PASSWORD")

        # Unterstütze mehrere Empfänger (kommagetrennt)
        recipients = [r.strip() for r in recipient.split(",") if r.strip()]
        
        if not recipients:
            raise MailServiceError("Keine gültigen Empfänger angegeben")

        msg = EmailMessage()
        msg["Subject"] = "Zeitaufzeichnung – Formular"
        msg["From"] = smtp_user
        msg["To"] = ", ".join(recipients)

        msg.set_content(
            "Hallo,\n\nanbei deine Zeitaufzeichnung als PDF.\n\nViele Grüße\nZeitaufzeichnung Web"
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

        with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            
        logger.info(f"PDF erfolgreich versendet an {len(recipients)} Empfänger")
        
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP-Authentifizierung fehlgeschlagen: {e}")
        raise MailServiceError(f"E-Mail-Authentifizierung fehlgeschlagen: {e}")
    except smtplib.SMTPException as e:
        logger.error(f"SMTP-Fehler beim PDF-Versand: {e}")
        raise MailServiceError(f"E-Mail-Versand fehlgeschlagen: {e}")
    except FileNotFoundError:
        logger.error(f"PDF-Datei nicht gefunden: {pdf_path}")
        raise MailServiceError(f"PDF-Datei nicht gefunden: {pdf_path}")
    except Exception as e:
        logger.error(f"Unerwarteter Fehler beim PDF-Versand: {e}")
        raise MailServiceError(f"E-Mail-Versand fehlgeschlagen: {e}")


def send_csv_mail(csv_path: str, recipient: str, filename: str = None) -> None:
    """
    Sendet CSV-Datei per E-Mail
    
    Args:
        csv_path: Pfad zur CSV-Datei
        recipient: E-Mail-Empfänger (oder mehrere kommagetrennt)
        filename: Optionaler Dateiname für Anhang
        
    Raises:
        MailServiceError: Bei Fehlern beim E-Mail-Versand
    """
    try:
        smtp_host = (os.getenv("SMTP_HOST") or "smtp.gmail.com").strip()
        smtp_port = int((os.getenv("SMTP_PORT") or "587").strip())

        smtp_user = _get_env("SMTP_USER")
        smtp_password = _get_env("SMTP_PASSWORD")

        # Unterstütze mehrere Empfänger (kommagetrennt)
        recipients = [r.strip() for r in recipient.split(",") if r.strip()]
        
        if not recipients:
            raise MailServiceError("Keine gültigen Empfänger angegeben")

        msg = EmailMessage()
        msg["Subject"] = "Zeitaufzeichnung – CSV Daten"
        msg["From"] = smtp_user
        msg["To"] = ", ".join(recipients)

        msg.set_content(
            "Hallo,\n\nanbei die Zeitaufzeichnungsdaten als CSV-Datei.\n\nViele Grüße\nZeitaufzeichnung Web"
        )

        with open(csv_path, "rb") as f:
            csv_data = f.read()

        attach_name = filename or os.path.basename(csv_path)

        msg.add_attachment(
            csv_data,
            maintype="text",
            subtype="csv",
            filename=attach_name,
        )

        with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            
        logger.info(f"CSV erfolgreich versendet an {len(recipients)} Empfänger")
        
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP-Authentifizierung fehlgeschlagen: {e}")
        raise MailServiceError(f"E-Mail-Authentifizierung fehlgeschlagen: {e}")
    except smtplib.SMTPException as e:
        logger.error(f"SMTP-Fehler beim CSV-Versand: {e}")
        raise MailServiceError(f"E-Mail-Versand fehlgeschlagen: {e}")
    except FileNotFoundError:
        logger.error(f"CSV-Datei nicht gefunden: {csv_path}")
        raise MailServiceError(f"CSV-Datei nicht gefunden: {csv_path}")
    except Exception as e:
        logger.error(f"Unerwarteter Fehler beim CSV-Versand: {e}")
        raise MailServiceError(f"E-Mail-Versand fehlgeschlagen: {e}")


def send_reset_mail(email: str, reset_url: str) -> None:
    """
    Sendet E-Mail mit Passwort-Reset-Link
    
    Args:
        email: E-Mail-Adresse des Empfängers
        reset_url: URL für Passwort-Reset
        
    Raises:
        MailServiceError: Bei Fehlern beim E-Mail-Versand
    """
    try:
        smtp_host = (os.getenv("SMTP_HOST") or "smtp.gmail.com").strip()
        smtp_port = int((os.getenv("SMTP_PORT") or "587").strip())

        smtp_user = _get_env("SMTP_USER")
        smtp_password = _get_env("SMTP_PASSWORD")

        msg = EmailMessage()
        msg["Subject"] = "Zeitaufzeichnung – Passwort zurücksetzen"
        msg["From"] = smtp_user
        msg["To"] = email

        msg.set_content(
            f"""Hallo,

du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.

Klicke auf folgenden Link, um ein neues Passwort zu setzen:
{reset_url}

Dieser Link ist 1 Stunde gültig.

Falls du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail einfach.

Viele Grüße
Zeitaufzeichnung Web
"""
        )

        with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            
        logger.info(f"Reset-Mail erfolgreich versendet an {email}")
        
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP-Authentifizierung fehlgeschlagen: {e}")
        raise MailServiceError(f"E-Mail-Authentifizierung fehlgeschlagen: {e}")
    except smtplib.SMTPException as e:
        logger.error(f"SMTP-Fehler beim Reset-Mail-Versand: {e}")
        raise MailServiceError(f"E-Mail-Versand fehlgeschlagen: {e}")
    except Exception as e:
        logger.error(f"Unerwarteter Fehler beim Reset-Mail-Versand: {e}")
        raise MailServiceError(f"E-Mail-Versand fehlgeschlagen: {e}")

