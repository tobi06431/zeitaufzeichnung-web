#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script zum Anzeigen aller Benutzer und Statistiken
Verwendung: python3 show_users.py
"""

from users import init_db, get_all_users

def main():
    init_db()
    
    users = get_all_users()
    
    print("\n" + "="*60)
    print("BENUTZER-STATISTIK")
    print("="*60)
    
    total = len(users)
    approved = sum(1 for u in users if u.is_approved)
    pending = sum(1 for u in users if not u.is_approved)
    admins = sum(1 for u in users if u.is_admin)
    
    print(f"\n📊 Gesamt:          {total}")
    print(f"✅ Genehmigt:       {approved}")
    print(f"⏳ Wartend:         {pending}")
    print(f"👑 Admins:          {admins}")
    
    print("\n" + "="*60)
    print("BENUTZER-LISTE")
    print("="*60 + "\n")
    
    for user in users:
        status = "✅" if user.is_approved else "⏳"
        admin_badge = " 👑" if user.is_admin else ""
        email_info = f" ({user.email})" if user.email else ""
        
        print(f"{status} {user.username}{admin_badge}{email_info}")
        print(f"   Pfarrei: {user.pfarrei}")
        print()
    
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
