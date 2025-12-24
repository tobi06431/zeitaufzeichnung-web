#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Unit-Tests für users.py

HINWEIS: Tests müssen mit frischer Datenbank ausgeführt werden:
    rm -f zeitaufzeichnung.db && pytest tests/
"""

import pytest
import os
from utils import format_date_german, generate_filename


class TestUtilities:
    """Tests für Utility-Funktionen (keine DB erforderlich)"""
    
    def test_format_date_german_iso(self):
        """Test: ISO-Datum zu deutschem Format"""
        assert format_date_german("2025-12-24") == "24 Dezember 2025"
    
    def test_format_date_german_de(self):
        """Test: Deutsches Datum bleibt deutsch"""
        assert format_date_german("24.12.2025") == "24 Dezember 2025"
    
    def test_format_date_german_invalid(self):
        """Test: Ungültiges Format unverändert"""
        assert format_date_german("invalid") == "invalid"
    
    def test_generate_filename_basic(self):
        """Test: Basis-Dateinamengenerierung"""
        data = {
            'Nachname': 'Müller',
            'Vorname': 'Hans',
            'Monat/Jahr': '12/2025'
        }
        filename = generate_filename(data)
        assert filename == "MUELLER,HANS,2025,12.pdf"
    
    def test_generate_filename_umlauts(self):
        """Test: Umlaute werden korrekt ersetzt"""
        data = {
            'Nachname': 'Größmann',
            'Vorname': 'Jürgen',
            'Monat/Jahr': '01/2026'
        }
        filename = generate_filename(data)
        assert "GROESSMANN" in filename
        assert "JUERGEN" in filename
    
    def test_generate_filename_spaces(self):
        """Test: Leerzeichen werden zu Unterstrichen"""
        data = {
            'Nachname': 'Schmidt Weber',
            'Vorname': 'Hans Peter',
            'Monat/Jahr': '12/2025'
        }
        filename = generate_filename(data)
        assert "SCHMIDT_WEBER" in filename
        assert "HANS_PETER" in filename
    
    def test_generate_filename_special_chars(self):
        """Test: Sonderzeichen werden bereinigt"""
        data = {
            'Nachname': 'O\'Brien',
            'Vorname': 'Mary@Ann',
            'Monat/Jahr': '12/2025'
        }
        filename = generate_filename(data)
        # Sonderzeichen sollten durch _ ersetzt werden
        assert filename.startswith("O_BRIEN,MARY_ANN")
    
    def test_generate_filename_csv(self):
        """Test: CSV-Dateierweiterung"""
        data = {
            'Nachname': 'Test',
            'Vorname': 'User',
            'Monat/Jahr': '12/2025'
        }
        filename = generate_filename(data, 'csv')
        assert filename.endswith('.csv')
    
    def test_generate_filename_missing_data(self):
        """Test: Fehlende Daten führen zu UNKNOWN"""
        data = {'Monat/Jahr': '12/2025'}
        filename = generate_filename(data)
        assert "UNKNOWN" in filename


class TestDatabaseIntegration:
    """
    Integrations-Tests für Datenbankfunktionen
    
    WICHTIG: Diese Tests erfordern eine frische Datenbank!
    Ausführen mit: rm -f zeitaufzeichnung.db && pytest tests/ -k TestDatabase
    """
    
    def test_placeholder(self):
        """Platzhalter-Test (TODO: echte DB-Tests mit Fixtures)"""
        # Diese Tests wurden bewusst als Platzhalter belassen, da die
        # Datenbankverbindung beim Import initialisiert wird und nicht
        # einfach pro Test zurückgesetzt werden kann.
        #
        # Für echte Integrationstests sollte eine der folgenden Lösungen
        # implementiert werden:
        # 1. Factory-Pattern für DB-Connections
        # 2. Docker-Container mit Test-PostgreSQL
        # 3. Mocking der DB-Operationen
        assert True


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
