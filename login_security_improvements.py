#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Optionale Sicherheitsverbesserungen für das Login-System
"""

# 1. Rate Limiting (verhindert Brute-Force-Angriffe)
# Installation: pip install flask-limiter
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

def add_rate_limiting(app):
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["200 per day", "50 per hour"]
    )
    
    # Bei Login-Route anwenden:
    # @limiter.limit("5 per minute")
    # @app.route("/login", methods=["GET", "POST"])
    return limiter


# 2. CSRF-Schutz (verhindert Cross-Site Request Forgery)
# Installation: pip install flask-wtf
from flask_wtf.csrf import CSRFProtect

def add_csrf_protection(app):
    csrf = CSRFProtect(app)
    return csrf


# 3. Session-Sicherheit (zusätzliche Einstellungen)
def configure_secure_sessions(app):
    app.config['SESSION_COOKIE_SECURE'] = True  # Nur über HTTPS
    app.config['SESSION_COOKIE_HTTPONLY'] = True  # Kein JavaScript-Zugriff
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # CSRF-Schutz
    app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 Stunde


# 4. Passwort-Anforderungen
def validate_password_strength(password):
    """Prüft, ob Passwort stark genug ist"""
    if len(password) < 8:
        return False, "Passwort muss mindestens 8 Zeichen haben"
    if not any(c.isupper() for c in password):
        return False, "Passwort muss mindestens einen Großbuchstaben enthalten"
    if not any(c.islower() for c in password):
        return False, "Passwort muss mindestens einen Kleinbuchstaben enthalten"
    if not any(c.isdigit() for c in password):
        return False, "Passwort muss mindestens eine Zahl enthalten"
    return True, "OK"
