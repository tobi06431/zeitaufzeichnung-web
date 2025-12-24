#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Utility-Funktionen für die Zeitaufzeichnung-App
"""

import re
from datetime import date


def generate_filename(data, file_extension='pdf'):
    """
    Generiert standardisierten Dateinamen aus Formulardaten.
    
    Format: NACHNAME,VORNAME,JAHR,MONAT.{extension}
    Beispiel: MUELLER,HANS,2025,12.pdf
    
    Args:
        data (dict): Formulardaten mit Nachname, Vorname, Monat/Jahr
        file_extension (str): Dateiendung (pdf, csv)
    
    Returns:
        str: Sanitierter Dateiname
    """
    # Umlaute ersetzen vor Großschreibung
    def replace_umlauts(text):
        replacements = {'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss',
                       'Ä': 'Ae', 'Ö': 'Oe', 'Ü': 'Ue'}
        for umlaut, replacement in replacements.items():
            text = text.replace(umlaut, replacement)
        return text
    
    nachname = replace_umlauts(data.get('Nachname') or '').strip().upper().replace(' ', '_')
    vorname = replace_umlauts(data.get('Vorname') or '').strip().upper().replace(' ', '_')
    monat_jahr = (data.get('Monat/Jahr') or '').strip()
    
    # Parse Monat/Jahr
    monat, jahr = None, None
    match = re.match(r'^(\d{2})\/(\d{4})$', monat_jahr)
    if match:
        monat = match.group(1)
        jahr = match.group(2)
    else:
        # Fallback auf aktuelles Datum
        today = date.today()
        monat = f"{today.month:02d}"
        jahr = f"{today.year}"
    
    # Sanitize: Nur alphanumerische Zeichen, Kommas, Unterstriche
    def clean(s):
        return re.sub(r'[^A-Z0-9_,\-\.]', '_', s)
    
    nachname = clean(nachname) or 'UNKNOWN'
    vorname = clean(vorname) or 'UNKNOWN'
    
    return f"{nachname},{vorname},{jahr},{monat}.{file_extension}"


def format_date_german(date_str):
    """
    Konvertiert ISO-Datum zu deutschem Format.
    
    Args:
        date_str (str): Datum als String (YYYY-MM-DD oder DD.MM.YYYY)
    
    Returns:
        str: Datum im Format "Tag Monat Jahr" (z.B. "23 Dezember 2025")
    """
    from datetime import datetime
    
    monate = [
        "Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember"
    ]
    
    try:
        # Versuche verschiedene Formate
        if "-" in date_str and len(date_str) == 10:
            datum_obj = datetime.strptime(date_str, "%Y-%m-%d")
        elif "." in date_str and len(date_str) == 10:
            datum_obj = datetime.strptime(date_str, "%d.%m.%Y")
        else:
            return date_str
        
        return f"{datum_obj.day} {monate[datum_obj.month - 1]} {datum_obj.year}"
    except Exception:
        return date_str
