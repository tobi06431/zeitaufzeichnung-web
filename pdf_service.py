#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Dec 15 18:57:49 2025

@author: tobiaslassmann
"""

# pdf_service.py
from pypdf import PdfReader, PdfWriter

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


def create_pdf(form_data: dict, output_path: str):
    """
    form_data: dict mit Keys wie im HTML-Form (z.B. 'Nachname', 'GKZ', ...)
    output_path: wo das fertige PDF gespeichert werden soll
    """
    reader = PdfReader(TEMPLATE)
    writer = PdfWriter()
    writer.append(reader)

    werte_pdf = {}

    # Textfelder
    for key, value in (form_data or {}).items():
        if value is None:
            continue
        value = str(value).strip()
        if not value:
            continue
        if key in PDF_FIELD_MAP:
            werte_pdf[PDF_FIELD_MAP[key]] = value

    # Checkboxen: Mehrarbeitsstunden auszahlen (optional, je nach HTML)
    # Erwartet im HTML z.B. name="Mehrarbeit_auszahlen" value="Ja"/"Nein"
    auszahlung = (form_data.get("Mehrarbeit_auszahlen") or "").strip()
    werte_pdf["Markierfeld 1"] = CHECK_ON_VALUE if auszahlung == "Ja" else CHECK_OFF_VALUE
    werte_pdf["Markierfeld 1_2"] = CHECK_ON_VALUE if auszahlung == "Nein" else CHECK_OFF_VALUE

    writer.update_page_form_field_values(writer.pages[0], werte_pdf)

    with open(output_path, "wb") as f:
        writer.write(f)
