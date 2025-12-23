#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import bcrypt
import secrets
from datetime import datetime, timedelta
from flask_login import UserMixin

# Datenbank-Konfiguration: PostgreSQL (Production) oder SQLite (Lokal)
DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    # PostgreSQL für Production (Render)
    import psycopg2
    from psycopg2.extras import RealDictCursor
    USE_POSTGRES = True
    # Render gibt manchmal postgres:// statt postgresql:// - fix das
    if DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
else:
    # SQLite für lokale Entwicklung
    import sqlite3
    USE_POSTGRES = False
    DATABASE = 'users.db'


def get_db_connection():
    """Erstellt Datenbankverbindung (PostgreSQL oder SQLite)"""
    if USE_POSTGRES:
        return psycopg2.connect(DATABASE_URL)
    else:
        return sqlite3.connect(DATABASE)


class User(UserMixin):
    """Minimales User-Modell für Flask-Login"""
    def __init__(self, id, username, pfarrei, email=None, is_admin=False, is_approved=True, password_hash=None):
        self.id = id
        self.username = username
        self.pfarrei = pfarrei
        self.email = email
        self.is_admin = is_admin
        self.is_approved = is_approved
        self.password_hash = password_hash


def init_db():
    """Erstellt die User-Tabelle, falls nicht vorhanden"""
    conn = get_db_connection()
    c = conn.cursor()
    
    if USE_POSTGRES:
        c.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                pfarrei TEXT NOT NULL,
                email VARCHAR(255),
                is_admin BOOLEAN DEFAULT FALSE,
                is_approved BOOLEAN DEFAULT FALSE,
                reset_token TEXT,
                reset_token_expiry TIMESTAMP
            )
        ''')
    else:
        c.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                pfarrei TEXT NOT NULL,
                email TEXT,
                is_admin INTEGER DEFAULT 0,
                is_approved INTEGER DEFAULT 0,
                reset_token TEXT,
                reset_token_expiry TEXT
            )
        ''')
    
    conn.commit()
    conn.close()


def init_timerecords_table():
    """Erstellt die Tabelle für Zeitaufzeichnungen"""
    conn = get_db_connection()
    c = conn.cursor()
    
    if USE_POSTGRES:
        c.execute('''
            CREATE TABLE IF NOT EXISTS timerecords (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                month_year VARCHAR(10) NOT NULL,
                form_data TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'draft',
                submitted_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(user_id, month_year)
            )
        ''')
    else:
        c.execute('''
            CREATE TABLE IF NOT EXISTS timerecords (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                month_year TEXT NOT NULL,
                form_data TEXT NOT NULL,
                status TEXT DEFAULT 'draft',
                submitted_at TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(user_id, month_year)
            )
        ''')
    
    conn.commit()
    
    # Migration: Füge status und submitted_at hinzu falls nicht vorhanden
    try:
        if USE_POSTGRES:
            c.execute("ALTER TABLE timerecords ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft'")
            c.execute("ALTER TABLE timerecords ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP")
        else:
            c.execute("PRAGMA table_info(timerecords)")
            columns = [row[1] for row in c.fetchall()]
            if 'status' not in columns:
                c.execute("ALTER TABLE timerecords ADD COLUMN status TEXT DEFAULT 'draft'")
            if 'submitted_at' not in columns:
                c.execute("ALTER TABLE timerecords ADD COLUMN submitted_at TEXT")
        conn.commit()
    except Exception as e:
        print(f"Migration Warnung: {e}")
        conn.rollback()
    
    conn.close()


def get_user_by_id(user_id):
    """Lädt User anhand der ID"""
    conn = get_db_connection()
    c = conn.cursor()
    
    if USE_POSTGRES:
        c.execute('SELECT id, username, pfarrei, email, is_admin, is_approved FROM users WHERE id = %s', (user_id,))
    else:
        c.execute('SELECT id, username, pfarrei, email, is_admin, is_approved FROM users WHERE id = ?', (user_id,))
    
    row = c.fetchone()
    conn.close()
    
    if row:
        if USE_POSTGRES:
            return User(id=row[0], username=row[1], pfarrei=row[2], email=row[3], is_admin=row[4], is_approved=row[5])
        else:
            return User(id=row[0], username=row[1], pfarrei=row[2], email=row[3], is_admin=bool(row[4]), is_approved=bool(row[5]))
    return None


def get_user_by_username(username):
    """Lädt User anhand des Usernamens"""
    conn = get_db_connection()
    c = conn.cursor()
    
    if USE_POSTGRES:
        c.execute('SELECT id, username, pfarrei, email, is_admin, is_approved FROM users WHERE username = %s', (username,))
    else:
        c.execute('SELECT id, username, pfarrei, email, is_admin, is_approved FROM users WHERE username = ?', (username,))
    
    row = c.fetchone()
    conn.close()
    
    if row:
        if USE_POSTGRES:
            return User(id=row[0], username=row[1], pfarrei=row[2], email=row[3], is_admin=row[4], is_approved=row[5])
        else:
            return User(id=row[0], username=row[1], pfarrei=row[2], email=row[3], is_admin=bool(row[4]), is_approved=bool(row[5]))
    return None


def verify_password(username, password):
    """Prüft Passwort und gibt User zurück wenn korrekt und approved"""
    conn = get_db_connection()
    c = conn.cursor()
    
    if USE_POSTGRES:
        c.execute('SELECT id, username, password_hash, pfarrei, email, is_admin, is_approved FROM users WHERE username = %s', (username,))
    else:
        c.execute('SELECT id, username, password_hash, pfarrei, email, is_admin, is_approved FROM users WHERE username = ?', (username,))
    
    row = c.fetchone()
    conn.close()
    
    if not row:
        return None
    
    # Passwort-Check
    if bcrypt.checkpw(password.encode('utf-8'), row[2].encode('utf-8')):
        if USE_POSTGRES:
            return User(id=row[0], username=row[1], pfarrei=row[3], email=row[4], is_admin=row[5], is_approved=row[6])
        else:
            return User(id=row[0], username=row[1], pfarrei=row[3], email=row[4], is_admin=bool(row[5]), is_approved=bool(row[6]))
    
    return None


def create_user(username, password, pfarrei, email=None, is_admin=False, is_approved=False):
    """Erstellt einen neuen User mit Passwort-Validierung"""
    # Passwort-Validierung
    if len(password) < 8:
        raise ValueError("Passwort muss mindestens 8 Zeichen haben")
    if not any(c.isupper() for c in password):
        raise ValueError("Passwort muss mindestens einen Großbuchstaben enthalten")
    if not any(c.islower() for c in password):
        raise ValueError("Passwort muss mindestens einen Kleinbuchstaben enthalten")
    if not any(c.isdigit() for c in password):
        raise ValueError("Passwort muss mindestens eine Zahl enthalten")
    
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    conn = get_db_connection()
    c = conn.cursor()
    try:
        if USE_POSTGRES:
            c.execute('INSERT INTO users (username, password_hash, pfarrei, email, is_admin, is_approved) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id',
                      (username, password_hash, pfarrei, email, is_admin, is_approved))
            user_id = c.fetchone()[0]
        else:
            c.execute('INSERT INTO users (username, password_hash, pfarrei, email, is_admin, is_approved) VALUES (?, ?, ?, ?, ?, ?)',
                      (username, password_hash, pfarrei, email, int(is_admin), int(is_approved)))
            user_id = c.lastrowid
        
        conn.commit()
        conn.close()
        return User(id=user_id, username=username, pfarrei=pfarrei, email=email, is_admin=is_admin, is_approved=is_approved)
    except (psycopg2.IntegrityError if USE_POSTGRES else sqlite3.IntegrityError):
        conn.close()
        return None  # Username existiert bereits


def get_all_users():
    """Gibt alle Benutzer zurück (für Admin-Dashboard)"""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT id, username, pfarrei, email, is_admin, is_approved FROM users ORDER BY id DESC')
    rows = c.fetchall()
    conn.close()
    
    if USE_POSTGRES:
        return [User(id=row[0], username=row[1], pfarrei=row[2], email=row[3], is_admin=row[4], is_approved=row[5]) for row in rows]
    else:
        return [User(id=row[0], username=row[1], pfarrei=row[2], email=row[3], is_admin=bool(row[4]), is_approved=bool(row[5])) for row in rows]


def approve_user(user_id):
    """Genehmigt einen Benutzer"""
    conn = get_db_connection()
    c = conn.cursor()
    
    if USE_POSTGRES:
        c.execute('UPDATE users SET is_approved = TRUE WHERE id = %s', (user_id,))
    else:
        c.execute('UPDATE users SET is_approved = 1 WHERE id = ?', (user_id,))
    
    conn.commit()
    conn.close()


def reject_user(user_id):
    """Löscht einen nicht genehmigten Benutzer"""
    conn = get_db_connection()
    c = conn.cursor()
    
    if USE_POSTGRES:
        c.execute('DELETE FROM users WHERE id = %s', (user_id,))
    else:
        c.execute('DELETE FROM users WHERE id = ?', (user_id,))
    
    conn.commit()
    conn.close()


def get_user_by_email(email):
    """Lädt User anhand der E-Mail"""
    conn = get_db_connection()
    c = conn.cursor()
    
    if USE_POSTGRES:
        c.execute('SELECT id, username, password_hash, pfarrei, email, is_admin, is_approved FROM users WHERE email = %s', (email,))
    else:
        c.execute('SELECT id, username, password_hash, pfarrei, email, is_admin, is_approved FROM users WHERE email = ?', (email,))
    
    row = c.fetchone()
    conn.close()
    
    if row:
        if USE_POSTGRES:
            return User(id=row[0], username=row[1], pfarrei=row[3], email=row[4], is_admin=row[5], is_approved=row[6], password_hash=row[2])
        else:
            return User(id=row[0], username=row[1], pfarrei=row[3], email=row[4], is_admin=bool(row[5]), is_approved=bool(row[6]), password_hash=row[2])
    return None


def create_reset_token(user_id):
    """Erstellt einen Reset-Token für einen Benutzer (gültig 1 Stunde)"""
    token = secrets.token_urlsafe(32)
    expiry = datetime.now() + timedelta(hours=1)
    
    conn = get_db_connection()
    c = conn.cursor()
    
    if USE_POSTGRES:
        c.execute('UPDATE users SET reset_token = %s, reset_token_expiry = %s WHERE id = %s',
                  (token, expiry, user_id))
    else:
        c.execute('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
                  (token, expiry.isoformat(), user_id))
    
    conn.commit()
    conn.close()
    
    return token


def get_user_by_reset_token(token):
    """Lädt User anhand des Reset-Tokens (wenn noch gültig)"""
    conn = get_db_connection()
    c = conn.cursor()
    
    if USE_POSTGRES:
        c.execute('SELECT id, username, pfarrei, email, is_admin, is_approved, reset_token_expiry FROM users WHERE reset_token = %s', (token,))
    else:
        c.execute('SELECT id, username, pfarrei, email, is_admin, is_approved, reset_token_expiry FROM users WHERE reset_token = ?', (token,))
    
    row = c.fetchone()
    conn.close()
    
    if not row:
        return None
    
    # Token-Ablauf prüfen
    if USE_POSTGRES:
        expiry = row[6]
    else:
        expiry = datetime.fromisoformat(row[6])
    
    if datetime.now() > expiry:
        return None  # Token abgelaufen
    
    if USE_POSTGRES:
        return User(id=row[0], username=row[1], pfarrei=row[2], email=row[3], is_admin=row[4], is_approved=row[5])
    else:
        return User(id=row[0], username=row[1], pfarrei=row[2], email=row[3], is_admin=bool(row[4]), is_approved=bool(row[5]))


def reset_password(user_id, new_password):
    """Setzt neues Passwort und löscht Reset-Token"""
    # Passwort-Validierung
    if len(new_password) < 8:
        raise ValueError("Passwort muss mindestens 8 Zeichen haben")
    if not any(c.isupper() for c in new_password):
        raise ValueError("Passwort muss mindestens einen Großbuchstaben enthalten")
    if not any(c.islower() for c in new_password):
        raise ValueError("Passwort muss mindestens einen Kleinbuchstaben enthalten")
    if not any(c.isdigit() for c in new_password):
        raise ValueError("Passwort muss mindestens eine Zahl enthalten")
    
    password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    conn = get_db_connection()
    c = conn.cursor()
    
    if USE_POSTGRES:
        c.execute('UPDATE users SET password_hash = %s, reset_token = NULL, reset_token_expiry = NULL WHERE id = %s',
                  (password_hash, user_id))
    else:
        c.execute('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
                  (password_hash, user_id))
    
    conn.commit()
    conn.close()


def delete_user_account(user_id):
    """Löscht einen User-Account komplett (DSGVO Art. 17 - Recht auf Löschung)"""
    conn = get_db_connection()
    c = conn.cursor()
    
    if USE_POSTGRES:
        c.execute('DELETE FROM users WHERE id = %s', (user_id,))
    else:
        c.execute('DELETE FROM users WHERE id = ?', (user_id,))
    
    conn.commit()
    conn.close()


# ============= Zeitaufzeichnungen =============

def save_timerecord(user_id, month_year, form_data):
    """Speichert oder aktualisiert eine Zeitaufzeichnung"""
    conn = get_db_connection()
    c = conn.cursor()
    
    if USE_POSTGRES:
        c.execute('''
            INSERT INTO timerecords (user_id, month_year, form_data, updated_at)
            VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, month_year)
            DO UPDATE SET form_data = EXCLUDED.form_data, updated_at = CURRENT_TIMESTAMP
        ''', (user_id, month_year, form_data))
    else:
        # SQLite: Erst prüfen ob existiert
        c.execute('SELECT id FROM timerecords WHERE user_id = ? AND month_year = ?', (user_id, month_year))
        existing = c.fetchone()
        
        if existing:
            c.execute('UPDATE timerecords SET form_data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND month_year = ?',
                      (form_data, user_id, month_year))
        else:
            c.execute('INSERT INTO timerecords (user_id, month_year, form_data) VALUES (?, ?, ?)',
                      (user_id, month_year, form_data))
    
    conn.commit()
    conn.close()


def get_timerecord(user_id, month_year):
    """Lädt eine Zeitaufzeichnung"""
    conn = get_db_connection()
    c = conn.cursor()
    
    if USE_POSTGRES:
        c.execute('SELECT form_data, updated_at FROM timerecords WHERE user_id = %s AND month_year = %s',
                  (user_id, month_year))
    else:
        c.execute('SELECT form_data, updated_at FROM timerecords WHERE user_id = ? AND month_year = ?',
                  (user_id, month_year))
    
    row = c.fetchone()
    conn.close()
    
    if row:
        return {"form_data": row[0], "updated_at": str(row[1])}
    return None


def get_all_timerecords(user_id):
    """Lädt alle Zeitaufzeichnungen eines Users"""
    conn = get_db_connection()
    c = conn.cursor()
    
    if USE_POSTGRES:
        c.execute('SELECT month_year, form_data, updated_at FROM timerecords WHERE user_id = %s ORDER BY month_year DESC',
                  (user_id,))
    else:
        c.execute('SELECT month_year, form_data, updated_at FROM timerecords WHERE user_id = ? ORDER BY month_year DESC',
                  (user_id,))
    
    rows = c.fetchall()
    conn.close()
    
    return [{"month_year": row[0], "form_data": row[1], "updated_at": str(row[2])} for row in rows]


def delete_timerecord(user_id, month_year):
    """Löscht eine Zeitaufzeichnung"""
    conn = get_db_connection()
    c = conn.cursor()
    
    if USE_POSTGRES:
        c.execute('DELETE FROM timerecords WHERE user_id = %s AND month_year = %s', (user_id, month_year))
    else:
        c.execute('DELETE FROM timerecords WHERE user_id = ? AND month_year = ?', (user_id, month_year))
    
    conn.commit()
    conn.close()


def submit_timerecord(user_id, month_year):
    """Markiert eine Zeitaufzeichnung als eingereicht"""
    conn = get_db_connection()
    c = conn.cursor()
    
    if USE_POSTGRES:
        c.execute('''UPDATE timerecords 
                     SET status = 'submitted', submitted_at = NOW() 
                     WHERE user_id = %s AND month_year = %s''', (user_id, month_year))
    else:
        c.execute('''UPDATE timerecords 
                     SET status = 'submitted', submitted_at = datetime('now') 
                     WHERE user_id = ? AND month_year = ?''', (user_id, month_year))
    
    conn.commit()
    conn.close()


def get_all_submitted_timerecords():
    """Lädt alle eingereichten Zeitaufzeichnungen für Admin"""
    conn = get_db_connection()
    c = conn.cursor()
    
    if USE_POSTGRES:
        c.execute('''SELECT tr.id, tr.user_id, u.username, u.email, tr.month_year, 
                            tr.form_data, tr.submitted_at, tr.status
                     FROM timerecords tr
                     JOIN users u ON tr.user_id = u.id
                     WHERE tr.status = 'submitted'
                     ORDER BY tr.submitted_at DESC''')
    else:
        c.execute('''SELECT tr.id, tr.user_id, u.username, u.email, tr.month_year, 
                            tr.form_data, tr.submitted_at, tr.status
                     FROM timerecords tr
                     JOIN users u ON tr.user_id = u.id
                     WHERE tr.status = 'submitted'
                     ORDER BY tr.submitted_at DESC''')
    
    rows = c.fetchall()
    conn.close()
    
    return [{
        "id": row[0],
        "user_id": row[1],
        "username": row[2],
        "email": row[3],
        "month_year": row[4],
        "form_data": row[5],
        "submitted_at": str(row[6]),
        "status": row[7]
    } for row in rows]


def init_profile_table():
    """Erstellt die Profile-Tabelle, falls nicht vorhanden"""
    conn = get_db_connection()
    c = conn.cursor()
    
    if USE_POSTGRES:
        c.execute('''
            CREATE TABLE IF NOT EXISTS profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL UNIQUE,
                vorname VARCHAR(255),
                nachname VARCHAR(255),
                geburtsdatum DATE,
                personalnummer VARCHAR(255),
                einsatzort VARCHAR(255),
                gkz VARCHAR(255),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ''')
    else:
        c.execute('''
            CREATE TABLE IF NOT EXISTS profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL UNIQUE,
                vorname TEXT,
                nachname TEXT,
                geburtsdatum TEXT,
                personalnummer TEXT,
                einsatzort TEXT,
                gkz TEXT,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ''')
    
    conn.commit()
    
    # Migration: Alte Spalten umbenennen/neue hinzufügen falls Tabelle bereits existiert
    try:
        if USE_POSTGRES:
            # Prüfe ob alte Spalten existieren und migriere
            c.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name='profiles' AND column_name='kirchengemeinde'
            """)
            if c.fetchone():
                # Alte Spalten löschen, neue hinzufügen
                c.execute("ALTER TABLE profiles DROP COLUMN IF EXISTS kirchengemeinde")
                c.execute("ALTER TABLE profiles DROP COLUMN IF EXISTS taetigkeit")
                c.execute("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personalnummer VARCHAR(255)")
                c.execute("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS einsatzort VARCHAR(255)")
                c.execute("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gkz VARCHAR(255)")
                conn.commit()
        else:
            # SQLite: Prüfe ob alte Spalten existieren
            c.execute("PRAGMA table_info(profiles)")
            columns = [row[1] for row in c.fetchall()]
            if 'kirchengemeinde' in columns:
                # SQLite unterstützt kein DROP COLUMN vor Version 3.35.0
                # Erstelle neue Tabelle und kopiere Daten
                c.execute('''
                    CREATE TABLE profiles_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL UNIQUE,
                        vorname TEXT,
                        nachname TEXT,
                        geburtsdatum TEXT,
                        personalnummer TEXT,
                        einsatzort TEXT,
                        gkz TEXT,
                        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                    )
                ''')
                c.execute('''
                    INSERT INTO profiles_new (user_id, vorname, nachname, geburtsdatum, updated_at)
                    SELECT user_id, vorname, nachname, geburtsdatum, updated_at FROM profiles
                ''')
                c.execute('DROP TABLE profiles')
                c.execute('ALTER TABLE profiles_new RENAME TO profiles')
                conn.commit()
    except Exception as e:
        print(f"Migration Warnung (kann ignoriert werden wenn Tabelle neu ist): {e}")
        conn.rollback()
    
    conn.close()


def get_profile(user_id):
    """Lädt Profildaten eines Users"""
    conn = get_db_connection()
    c = conn.cursor()
    
    if USE_POSTGRES:
        c.execute('''SELECT vorname, nachname, geburtsdatum, personalnummer, einsatzort, gkz 
                     FROM profiles WHERE user_id = %s''', (user_id,))
    else:
        c.execute('''SELECT vorname, nachname, geburtsdatum, personalnummer, einsatzort, gkz 
                     FROM profiles WHERE user_id = ?''', (user_id,))
    
    row = c.fetchone()
    conn.close()
    
    if row:
        return {
            'vorname': row[0] or '',
            'nachname': row[1] or '',
            'geburtsdatum': row[2] or '',
            'personalnummer': row[3] or '',
            'einsatzort': row[4] or '',
            'gkz': row[5] or ''
        }
    return {}


def save_profile(user_id, vorname, nachname, geburtsdatum, personalnummer, einsatzort, gkz):
    """Speichert oder aktualisiert Profildaten"""
    conn = get_db_connection()
    c = conn.cursor()
    
    if USE_POSTGRES:
        c.execute('''
            INSERT INTO profiles (user_id, vorname, nachname, geburtsdatum, personalnummer, einsatzort, gkz, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                vorname = EXCLUDED.vorname,
                nachname = EXCLUDED.nachname,
                geburtsdatum = EXCLUDED.geburtsdatum,
                personalnummer = EXCLUDED.personalnummer,
                einsatzort = EXCLUDED.einsatzort,
                gkz = EXCLUDED.gkz,
                updated_at = NOW()
        ''', (user_id, vorname, nachname, geburtsdatum, personalnummer, einsatzort, gkz))
    else:
        c.execute('''
            INSERT OR REPLACE INTO profiles (user_id, vorname, nachname, geburtsdatum, personalnummer, einsatzort, gkz, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ''', (user_id, vorname, nachname, geburtsdatum, personalnummer, einsatzort, gkz))
    
    conn.commit()
    conn.close()
