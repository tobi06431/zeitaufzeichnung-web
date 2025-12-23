#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sqlite3
import bcrypt
from flask_login import UserMixin

DATABASE = 'users.db'


class User(UserMixin):
    """Minimales User-Modell für Flask-Login"""
    def __init__(self, id, username, pfarrei):
        self.id = id
        self.username = username
        self.pfarrei = pfarrei


def init_db():
    """Erstellt die User-Tabelle, falls nicht vorhanden"""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            pfarrei TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()


def get_user_by_id(user_id):
    """Lädt User anhand der ID"""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('SELECT id, username, pfarrei FROM users WHERE id = ?', (user_id,))
    row = c.fetchone()
    conn.close()
    
    if row:
        return User(id=row[0], username=row[1], pfarrei=row[2])
    return None


def get_user_by_username(username):
    """Lädt User anhand des Usernamens"""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('SELECT id, username, pfarrei FROM users WHERE username = ?', (username,))
    row = c.fetchone()
    conn.close()
    
    if row:
        return User(id=row[0], username=row[1], pfarrei=row[2])
    return None


def verify_password(username, password):
    """Prüft Passwort und gibt User zurück wenn korrekt"""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('SELECT id, username, password_hash, pfarrei FROM users WHERE username = ?', (username,))
    row = c.fetchone()
    conn.close()
    
    if not row:
        return None
    
    # Passwort-Check
    if bcrypt.checkpw(password.encode('utf-8'), row[2].encode('utf-8')):
        return User(id=row[0], username=row[1], pfarrei=row[3])
    
    return None


def create_user(username, password, pfarrei):
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
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    try:
        c.execute('INSERT INTO users (username, password_hash, pfarrei) VALUES (?, ?, ?)',
                  (username, password_hash, pfarrei))
        conn.commit()
        user_id = c.lastrowid
        conn.close()
        return User(id=user_id, username=username, pfarrei=pfarrei)
    except sqlite3.IntegrityError:
        conn.close()
        return None  # Username existiert bereits
