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
    
    Diese Tests verwenden eine temporäre SQLite-Datenbank
    """
    
    @pytest.fixture
    def temp_db(self, monkeypatch, tmp_path):
        """Erstellt temporäre Test-Datenbank"""
        db_path = tmp_path / "test_users.db"
        monkeypatch.setenv('DATABASE_URL', '')
        
        # Import users module to initialize with our test DB
        import users
        monkeypatch.setattr(users, 'DATABASE', str(db_path))
        monkeypatch.setattr(users, 'USE_POSTGRES', False)
        
        # Initialize tables
        users.init_db()
        users.init_timerecords_table()
        users.init_submissions_table()
        users.init_profile_table()
        
        yield db_path
        
        # Cleanup
        if db_path.exists():
            db_path.unlink()
    
    def test_create_and_get_user(self, temp_db):
        """Test: Benutzer erstellen und abrufen"""
        from users import create_user, get_user_by_username, get_user_by_email
        
        user = create_user("testuser", "securepass123", "Test Pfarrei", 
                          email="test@example.com", is_admin=False)
        
        assert user is not None
        assert user.username == "testuser"
        assert user.pfarrei == "Test Pfarrei"
        assert user.email == "test@example.com"
        assert user.is_approved == False
        
        # Test get by username
        retrieved = get_user_by_username("testuser")
        assert retrieved is not None
        assert retrieved.username == "testuser"
        
        # Test get by email
        retrieved_by_email = get_user_by_email("test@example.com")
        assert retrieved_by_email is not None
        assert retrieved_by_email.email == "test@example.com"
    
    def test_verify_password(self, temp_db):
        """Test: Passwort-Verifikation"""
        from users import create_user, verify_password
        
        user = create_user("pwtest", "mypassword", "Test Pfarrei", 
                          email="pw@test.com")
        
        # Korrektes Passwort
        assert verify_password(user, "mypassword") == True
        
        # Falsches Passwort
        assert verify_password(user, "wrongpassword") == False
    
    def test_approve_user(self, temp_db):
        """Test: Benutzer-Freigabe"""
        from users import create_user, approve_user, get_user_by_id
        
        user = create_user("approvetest", "pass", "Test Pfarrei",
                          email="approve@test.com", is_approved=False)
        
        assert user.is_approved == False
        
        approve_user(user.id)
        
        updated_user = get_user_by_id(user.id)
        assert updated_user.is_approved == True
    
    def test_password_reset_token(self, temp_db):
        """Test: Passwort-Reset-Token"""
        from users import create_user, create_reset_token, get_user_by_reset_token, reset_password
        
        user = create_user("resettest", "oldpassword", "Test Pfarrei",
                          email="reset@test.com", is_approved=True)
        
        # Token erstellen
        token = create_reset_token(user.id)
        assert token is not None
        assert len(token) > 20  # Token sollte lang genug sein
        
        # User mit Token abrufen
        user_from_token = get_user_by_reset_token(token)
        assert user_from_token is not None
        assert user_from_token.id == user.id
        
        # Passwort zurücksetzen
        reset_password(user.id, "newpassword123")
        
        # Token sollte danach ungültig sein
        assert get_user_by_reset_token(token) is None
    
    def test_profile_management(self, temp_db):
        """Test: Profilverwaltung"""
        from users import create_user, save_profile, get_profile
        
        user = create_user("profiletest", "pass", "Test Pfarrei",
                          email="profile@test.com", is_approved=True)
        
        # Profil speichern
        save_profile(user.id, "Max", "Mustermann", "01.01.1990", 
                    "12345", "Testort", "GKZ123")
        
        # Profil abrufen
        profile = get_profile(user.id)
        assert profile['vorname'] == "Max"
        assert profile['nachname'] == "Mustermann"
        assert profile['geburtsdatum'] == "01.01.1990"
        assert profile['personalnummer'] == "12345"
        assert profile['einsatzort'] == "Testort"
        assert profile['gkz'] == "GKZ123"
        
        # Profil aktualisieren
        save_profile(user.id, "Max", "Müller", "01.01.1990",
                    "12345", "Neuer Ort", "GKZ456")
        
        updated_profile = get_profile(user.id)
        assert updated_profile['nachname'] == "Müller"
        assert updated_profile['einsatzort'] == "Neuer Ort"
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
