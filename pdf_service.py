#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# pdf_service.py
import json
import logging
from datetime import datetime
from pypdf import PdfReader, PdfWriter
from utils import generate_filename, format_date_german

logger = logging.getLogger(__name__)

TEMPLATE = "Zeitaufzeichnung_Gfb_-_Kuester__Chorleiter_Organisten.pdf"

PDF_FIELD_MAP = {
    "Kath. Kirchengemeinde": "Textfeld 2",
    "Einsatzort": "Textfeld 2_2",
    "GKZ": "Textfeld 1_6",
    "Monat/Jahr": "Textfeld 1_21",
    "Nachname": "Textfeld 1",
    "Vorname": "Textfeld 1_3",
    "Geburtsdatum": "Textfeld 1_4",
    "Pers.-Nr.": "Textfeld 1_2",
    "Tätigkeit": "Textfeld 1_5",
    "Beschäftigungsumfang": "Textfeld 1_7",
    "Mehrarbeit (Textfeld)": "Textfeld 1_8",
    "Mehrarbeit Stunden": "Textfeld 1_9",
    "Datum": "Textfeld 1_10",
}

CHECK_ON_VALUE = "/Yes"
CHECK_OFF_VALUE = "/Off"

# Optional: Satz im Kirchort-Feld sichtbar machen, z.B. "Eisenbach (25,00 €)"
INCLUDE_SATZ_IN_KIRCHORT = True


# Mapping: Tag -> (Feld für Kirchort, Feld für Beginn, Feld für Ende)
# (basierend auf deinen Screenshots in der Zeile "Dienste/Gottesdienste/Proben")
DAY_TO_FIELDS = {
    1:  ("Textfeld 1_23",  "Textfeld 1_29",  "Textfeld 1_83"),
    2:  ("Textfeld 1_31",  "Textfeld 1_82",  "Textfeld 1_32"),
    3:  ("Textfeld 1_35",  "Textfeld 1_36",  "Textfeld 1_84"),
    4:  ("Textfeld 1_39",  "Textfeld 1_40",  "Textfeld 1_85"),
    5:  ("Textfeld 1_43",  "Textfeld 1_44",  "Textfeld 1_86"),
    6:  ("Textfeld 1_47",  "Textfeld 1_48",  "Textfeld 1_87"),
    7:  ("Textfeld 1_51",  "Textfeld 1_52",  "Textfeld 1_88"),
    8:  ("Textfeld 1_89",  "Textfeld 1_90",  "Textfeld 1_91"),
    9:  ("Textfeld 1_92",  "Textfeld 1_93",  "Textfeld 1_94"),
    10: ("Textfeld 1_95",  "Textfeld 1_96",  "Textfeld 1_97"),
    11: ("Textfeld 1_98",  "Textfeld 1_99",  "Textfeld 1_100"),
    12: ("Textfeld 1_101", "Textfeld 1_102", "Textfeld 1_103"),
    13: ("Textfeld 1_104", "Textfeld 1_105", "Textfeld 1_106"),
    14: ("Textfeld 1_107", "Textfeld 1_108", "Textfeld 1_109"),
    15: ("Textfeld 1_110", "Textfeld 1_111", "Textfeld 1_112"),
    16: ("Textfeld 1_113", "Textfeld 1_114", "Textfeld 1_115"),
    17: ("Textfeld 1_116", "Textfeld 1_117", "Textfeld 1_118"),
    18: ("Textfeld 1_119", "Textfeld 1_120", "Textfeld 1_121"),
    19: ("Textfeld 1_122", "Textfeld 1_123", "Textfeld 1_124"),
    20: ("Textfeld 1_125", "Textfeld 1_126", "Textfeld 1_127"),
    21: ("Textfeld 1_128", "Textfeld 1_129", "Textfeld 1_130"),

    22: ("Textfeld 1_151", "Textfeld 1_152", "Textfeld 1_153"),
    23: ("Textfeld 1_154", "Textfeld 1_155", "Textfeld 1_156"),
    24: ("Textfeld 1_157", "Textfeld 1_158", "Textfeld 1_159"),
    25: ("Textfeld 1_160", "Textfeld 1_161", "Textfeld 1_162"),
    26: ("Textfeld 1_163", "Textfeld 1_164", "Textfeld 1_165"),
    27: ("Textfeld 1_166", "Textfeld 1_167", "Textfeld 1_168"),
    28: ("Textfeld 1_169", "Textfeld 1_170", "Textfeld 1_171"),
    29: ("Textfeld 1_172", "Textfeld 1_173", "Textfeld 1_174"),
    30: ("Textfeld 1_175", "Textfeld 1_176", "Textfeld 1_177"),
    31: ("Textfeld 1_178", "Textfeld 1_179", "Textfeld 1_180"),
}


def _safe_join(existing: str, new: str) -> str:
    """Falls mehrere Gottesdienste am selben Tag auftauchen: sauber zusammenfügen."""
    existing = (existing or "").strip()
    new = (new or "").strip()
    if not existing:
        return new
    if not new:
        return existing
    return existing + " | " + new


def _format_satz_eur(satz_value: str) -> str:
    """
    Macht aus "25" oder "25.0" oder "25,00" eine hübsche Anzeige "25,00 €" (best effort).
    """
    if not satz_value:
        return ""
    s = str(satz_value).strip().replace("€", "").strip()
    # Komma/ Punkt tolerant
    s_norm = s.replace(",", ".")
    try:
        num = float(s_norm)
        return f"{num:,.2f} €".replace(",", "X").replace(".", ",").replace("X", ".")
    except Exception:
        # wenn es kein float ist, einfach roh zurück
        return s + " €" if "€" not in s else s


def apply_gottesdienste_to_pdf_fields(fields: dict, gottesdienste_json: str) -> dict:
    """
    fields: dict, das an pypdf übergeben wird (PDF-Feldname -> Wert)
    gottesdienste_json: JSON-String aus request.form["Gottesdienste"]
    """
    try:
        gottesdienste = json.loads(gottesdienste_json or "[]")
        if not isinstance(gottesdienste, list):
            return fields
    except Exception:
        return fields

    for gd in gottesdienste:
        try:
            datum = (gd.get("datum") or "").strip()
            # datum kommt aus <input type="date"> als "YYYY-MM-DD"
            day = datetime.strptime(datum, "%Y-%m-%d").day

            kirchort = (gd.get("kirchort") or "").strip()
            beginn = (gd.get("beginn") or "").strip()
            ende = (gd.get("ende") or "").strip()
            satz = (gd.get("satz") or "").strip()

            if day not in DAY_TO_FIELDS:
                continue

            f_kirchort, f_beginn, f_ende = DAY_TO_FIELDS[day]

            if INCLUDE_SATZ_IN_KIRCHORT and satz:
                kirchort = f"{kirchort} ({_format_satz_eur(satz)})"

            fields[f_kirchort] = _safe_join(fields.get(f_kirchort, ""), kirchort)
            fields[f_beginn]   = _safe_join(fields.get(f_beginn, ""), beginn)
            fields[f_ende]     = _safe_join(fields.get(f_ende, ""), ende)

        except Exception:
            # Ein kaputter Eintrag soll das PDF nicht verhindern
            continue

    return fields


def apply_arbeitszeiten_to_pdf_fields(fields: dict, arbeitszeiten_json: str) -> dict:
    """
    fields: dict, das an pypdf übergeben wird (PDF-Feldname -> Wert)
    arbeitszeiten_json: JSON-String aus request.form["Arbeitszeiten"]
    """
    try:
        arbeitszeiten = json.loads(arbeitszeiten_json or "[]")
        if not isinstance(arbeitszeiten, list):
            return fields
    except Exception:
        return fields

    for az in arbeitszeiten:
        try:
            datum = (az.get("datum") or "").strip()
            # datum kommt aus <input type="date"> als "YYYY-MM-DD"
            day = datetime.strptime(datum, "%Y-%m-%d").day

            beginn = (az.get("beginn") or "").strip()
            ende = (az.get("ende") or "").strip()

            if day not in DAY_TO_FIELDS:
                continue

            f_kirchort, f_beginn, f_ende = DAY_TO_FIELDS[day]

            # Bei Arbeitszeiten lassen wir das Kirchort-Feld leer oder könnten einen Platzhalter einfügen
            # fields[f_kirchort] bleibt leer
            fields[f_beginn] = _safe_join(fields.get(f_beginn, ""), beginn)
            fields[f_ende]   = _safe_join(fields.get(f_ende, ""), ende)

        except Exception:
            # Ein kaputter Eintrag soll das PDF nicht verhindern
            continue

    return fields


def create_pdf(form_data: dict, output_path: str):
    """
    form_data: dict mit Keys wie im HTML-Form (z.B. 'Nachname', 'GKZ', ...)
    output_path: wo das fertige PDF gespeichert werden soll
    """
    reader = PdfReader(TEMPLATE)
    writer = PdfWriter()
    writer.append(reader)

    werte_pdf = {}

    # Textfelder (Seite 1 / Grunddaten)
    for key, value in (form_data or {}).items():
        if value is None:
            continue
        value = str(value).strip()
        if not value:
            continue
        
        # Formatiere Datum und Geburtsdatum als Tag Monat Jahr (z.B. 23 Dezember 2025)
        if key in ("Datum", "Geburtsdatum"):
            value = format_date_german(value)
        
        if key in PDF_FIELD_MAP:
            werte_pdf[PDF_FIELD_MAP[key]] = value

    # Checkboxen: Mehrarbeitsstunden auszahlen
    auszahlung = (form_data.get("Mehrarbeit_auszahlen") or "").strip()
    werte_pdf["Markierfeld 1"] = CHECK_ON_VALUE if auszahlung == "Ja" else CHECK_OFF_VALUE
    werte_pdf["Markierfeld 1_2"] = CHECK_ON_VALUE if auszahlung == "Nein" else CHECK_OFF_VALUE

    # >>> Basierend auf Tätigkeit entweder Gottesdienste oder Arbeitszeiten verwenden
    taetigkeit = (form_data.get("Tätigkeit") or "").strip()
    
    logger.debug(f"Tätigkeit: '{taetigkeit}'")
    
    if taetigkeit == "Organist":
        # Nur Gottesdienste für Organisten
        logger.debug("Verwende Gottesdienste")
        werte_pdf = apply_gottesdienste_to_pdf_fields(werte_pdf, form_data.get("Gottesdienste", "[]"))
    elif taetigkeit and taetigkeit != "":
        # Arbeitszeiten für alle anderen Tätigkeiten (aber nicht wenn Tätigkeit leer ist)
        logger.debug("Verwende Arbeitszeiten")
        werte_pdf = apply_arbeitszeiten_to_pdf_fields(werte_pdf, form_data.get("Arbeitszeiten", "[]"))
    else:
        logger.debug("Keine Tätigkeit ausgewählt - weder Gottesdienste noch Arbeitszeiten")

    # In alle Seiten schreiben (pypdf setzt pro Seite nur die Felder, die dort existieren)
    for page in writer.pages:
        writer.update_page_form_field_values(page, werte_pdf)

    with open(output_path, "wb") as f:
        writer.write(f)
