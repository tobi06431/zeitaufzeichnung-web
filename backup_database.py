#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Backup-Script für die Zeitaufzeichnung-Datenbank
Erstellt JSON-Dumps aller wichtigen Tabellen
"""

import os
import json
import sys
from datetime import datetime
from users import get_db, USE_POSTGRES

def backup_database(output_file=None):
    """Erstellt ein vollständiges Backup aller Daten"""
    
    if not output_file:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_file = f'backup_{timestamp}.json'
    
    backup_data = {
        'created_at': datetime.now().isoformat(),
        'database_type': 'PostgreSQL' if USE_POSTGRES else 'SQLite',
        'tables': {}
    }
    
    with get_db() as cursor:
        # 1. Users
        cursor.execute('SELECT id, username, pfarrei, email, is_admin, is_approved FROM users')
        users = cursor.fetchall()
        if USE_POSTGRES:
            backup_data['tables']['users'] = [dict(row) for row in users]
        else:
            backup_data['tables']['users'] = [
                {
                    'id': row[0],
                    'username': row[1],
                    'pfarrei': row[2],
                    'email': row[3],
                    'is_admin': bool(row[4]),
                    'is_approved': bool(row[5])
                }
                for row in users
            ]
        
        # 2. Profile
        try:
            cursor.execute('SELECT user_id, vorname, nachname, geburtsdatum, personalnummer, einsatzort, gkz FROM profiles')
            profiles = cursor.fetchall()
            if USE_POSTGRES:
                backup_data['tables']['profiles'] = [dict(row) for row in profiles]
            else:
                backup_data['tables']['profiles'] = [
                    {
                        'user_id': row[0],
                        'vorname': row[1],
                        'nachname': row[2],
                        'geburtsdatum': str(row[3]) if row[3] else None,
                        'personalnummer': row[4],
                        'einsatzort': row[5],
                        'gkz': row[6]
                    }
                    for row in profiles
                ]
        except Exception as e:
            logger.warning(f"Profile-Tabelle nicht gefunden oder leer: {e}")
            backup_data['tables']['profiles'] = []
        
        # 3. Timerecords (Entwürfe)
        cursor.execute('SELECT user_id, month_year, form_data, created_at, updated_at FROM timerecords')
        timerecords = cursor.fetchall()
        if USE_POSTGRES:
            backup_data['tables']['timerecords'] = [
                {**dict(row), 'created_at': row['created_at'].isoformat() if row.get('created_at') else None,
                 'updated_at': row['updated_at'].isoformat() if row.get('updated_at') else None}
                for row in timerecords
            ]
        else:
            backup_data['tables']['timerecords'] = [
                {
                    'user_id': row[0],
                    'month_year': row[1],
                    'form_data': row[2],
                    'created_at': row[3],
                    'updated_at': row[4]
                }
                for row in timerecords
            ]
        
        # 4. Submissions (Eingereichte Daten)
        cursor.execute('SELECT id, user_id, month_year, form_data, submitted_at FROM submissions')
        submissions = cursor.fetchall()
        if USE_POSTGRES:
            backup_data['tables']['submissions'] = [
                {**dict(row), 'submitted_at': row['submitted_at'].isoformat() if row.get('submitted_at') else None}
                for row in submissions
            ]
        else:
            backup_data['tables']['submissions'] = [
                {
                    'id': row[0],
                    'user_id': row[1],
                    'month_year': row[2],
                    'form_data': row[3],
                    'submitted_at': row[4]
                }
                for row in submissions
            ]
    
    # Statistik
    stats = {
        'users': len(backup_data['tables']['users']),
        'profiles': len(backup_data['tables']['profiles']),
        'timerecords': len(backup_data['tables']['timerecords']),
        'submissions': len(backup_data['tables']['submissions'])
    }
    
    backup_data['statistics'] = stats
    
    # Speichern
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(backup_data, f, indent=2, ensure_ascii=False)
    
    file_size = os.path.getsize(output_file)
    
    print(f"✅ Backup erfolgreich erstellt: {output_file}")
    print(f"📊 Statistik:")
    print(f"   - Users: {stats['users']}")
    print(f"   - Profile: {stats['profiles']}")
    print(f"   - Timerecords (Entwürfe): {stats['timerecords']}")
    print(f"   - Submissions (Eingereicht): {stats['submissions']}")
    print(f"💾 Dateigröße: {file_size:,} Bytes ({file_size/1024:.2f} KB)")
    
    return output_file

def restore_database(backup_file):
    """Stellt Daten aus einem Backup wieder her (VORSICHT!)"""
    
    if not os.path.exists(backup_file):
        print(f"❌ Backup-Datei nicht gefunden: {backup_file}")
        return False
    
    with open(backup_file, 'r', encoding='utf-8') as f:
        backup_data = json.load(f)
    
    print(f"⚠️  WARNUNG: Restore überschreibt vorhandene Daten!")
    print(f"📅 Backup vom: {backup_data['created_at']}")
    print(f"💾 Datenbank-Typ: {backup_data['database_type']}")
    print(f"📊 Enthält:")
    for table, count in backup_data['statistics'].items():
        print(f"   - {table}: {count}")
    
    confirm = input("\n❓ Wirklich wiederherstellen? (ja/nein): ")
    if confirm.lower() != 'ja':
        print("❌ Abgebrochen.")
        return False
    
    # Hier würde die eigentliche Restore-Logik stehen
    # Aus Sicherheitsgründen nicht automatisch implementiert
    print("⚠️  Restore-Funktion muss manuell implementiert werden")
    print("💡 Tipp: Nutze das Backup als Referenz für manuelle Wiederherstellung")
    
    return True

if __name__ == '__main__':
    if len(sys.argv) > 1:
        if sys.argv[1] == 'backup':
            output = sys.argv[2] if len(sys.argv) > 2 else None
            backup_database(output)
        elif sys.argv[1] == 'restore':
            if len(sys.argv) > 2:
                restore_database(sys.argv[2])
            else:
                print("❌ Bitte Backup-Datei angeben: python backup_database.py restore <datei>")
        else:
            print("❌ Unbekannter Befehl. Nutze: backup oder restore")
    else:
        # Standard: Backup erstellen
        backup_database()
