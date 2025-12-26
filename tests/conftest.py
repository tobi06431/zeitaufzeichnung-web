#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pytest Configuration und gemeinsame Fixtures
"""

import sys
from pathlib import Path

# Projektroot zum Python-Path hinzufügen, damit Imports funktionieren
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import pytest
from zeitaufzeichnungWeb import app as flask_app
from users import init_db, init_timerecords_table, init_submissions_table, init_profile_table


@pytest.fixture
def app():
    """Flask-App für Tests"""
    flask_app.config.update({
        "TESTING": True,
        "WTF_CSRF_ENABLED": False,  # CSRF für Tests deaktivieren
        "SECRET_KEY": "test-secret-key"
    })
    
    # Datenbank-Tabellen initialisieren
    init_db()
    init_timerecords_table()
    init_submissions_table()
    init_profile_table()
    
    yield flask_app


@pytest.fixture
def client(app):
    """Test-Client für HTTP-Requests"""
    return app.test_client()


@pytest.fixture
def runner(app):
    """CLI-Runner für CLI-Commands"""
    return app.test_cli_runner()
