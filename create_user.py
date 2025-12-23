#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script zum Erstellen eines neuen Benutzers
Verwendung: python create_user.py
"""

from users import create_user, init_db

def main():
    # Datenbank initialisieren
    init_db()
    
    print("=== Neuen Benutzer erstellen ===\n")
    
    username = input("Benutzername: ").strip()
    password = input("Passwort: ").strip()
    
    print("\nVerfügbare Pfarreien:")
    print("1. Heilige Katharina Kaspar Limburger Land")
    print("2. St. Peter und Paul Bad Camberg")
    print("3. Heilig Geist Goldener Grund")
    
    pfarreien = [
        "Heilige Katharina Kaspar Limburger Land",
        "St. Peter und Paul Bad Camberg",
        "Heilig Geist Goldener Grund"
    ]
    
    choice = input("\nPfarrei wählen (1-3): ").strip()
    
    if choice in ['1', '2', '3']:
        pfarrei = pfarreien[int(choice) - 1]
    else:
        pfarrei = input("Pfarrei-Name eingeben: ").strip()
    
    is_admin_input = input("\nAdmin-Rechte vergeben? (j/n): ").strip().lower()
    is_admin = is_admin_input == 'j'
    
    try:
        user = create_user(username, password, pfarrei, is_admin=is_admin, is_approved=True)
        
        if user:
            print(f"\n✅ Benutzer '{username}' erfolgreich erstellt!")
            print(f"   Pfarrei: {pfarrei}")
            print(f"   Admin: {'Ja' if is_admin else 'Nein'}")
            print(f"   Status: Genehmigt")
        else:
            print(f"\n❌ Fehler: Benutzer '{username}' existiert bereits.")
    except ValueError as e:
        print(f"\n❌ Fehler: {e}")
        print("\nPasswort-Anforderungen:")
        print("  - Mindestens 8 Zeichen")
        print("  - Mindestens 1 Großbuchstabe")
        print("  - Mindestens 1 Kleinbuchstabe")
        print("  - Mindestens 1 Zahl")


if __name__ == "__main__":
    main()
