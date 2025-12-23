#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Migrations-Script zum Aktualisieren der Datenbank
Fügt fehlende Spalten hinzu ohne Daten zu löschen
"""

import sqlite3

DATABASE = 'users.db'

def migrate_database():
    """Fügt neue Spalten zur users-Tabelle hinzu"""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Prüfe welche Spalten existieren
    c.execute("PRAGMA table_info(users)")
    columns = {row[1] for row in c.fetchall()}
    
    print("Vorhandene Spalten:", columns)
    print("\n" + "="*60)
    print("STARTE MIGRATION")
    print("="*60 + "\n")
    
    migrations = []
    
    # Füge is_admin hinzu falls nicht vorhanden
    if 'is_admin' not in columns:
        migrations.append(("is_admin INTEGER DEFAULT 0", "Admin-Feld"))
    
    # Füge is_approved hinzu falls nicht vorhanden
    if 'is_approved' not in columns:
        migrations.append(("is_approved INTEGER DEFAULT 1", "Genehmigungs-Feld (Standard: genehmigt für alte Accounts)"))
    
    # Füge email hinzu falls nicht vorhanden
    if 'email' not in columns:
        migrations.append(("email TEXT", "E-Mail-Feld"))
    
    # Füge reset_token hinzu falls nicht vorhanden
    if 'reset_token' not in columns:
        migrations.append(("reset_token TEXT", "Reset-Token-Feld"))
    
    # Füge reset_token_expiry hinzu falls nicht vorhanden
    if 'reset_token_expiry' not in columns:
        migrations.append(("reset_token_expiry TEXT", "Reset-Token-Ablauf-Feld"))
    
    if not migrations:
        print("✅ Datenbank ist bereits aktuell. Keine Migration nötig.\n")
    else:
        for column_def, description in migrations:
            column_name = column_def.split()[0]
            try:
                c.execute(f"ALTER TABLE users ADD COLUMN {column_def}")
                print(f"✅ {description} hinzugefügt")
            except sqlite3.OperationalError as e:
                print(f"⚠️  {description} konnte nicht hinzugefügt werden: {e}")
        
        conn.commit()
        print("\n✅ Migration erfolgreich abgeschlossen!\n")
    
    # Zeige Benutzeranzahl
    c.execute("SELECT COUNT(*) FROM users")
    count = c.fetchone()[0]
    print(f"📊 Anzahl Benutzer in Datenbank: {count}\n")
    
    conn.close()


if __name__ == "__main__":
    migrate_database()
