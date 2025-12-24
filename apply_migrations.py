#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Wendet SQL-Migrationen auf die Datenbank an
"""

import os
import logging
from users import get_db_connection, USE_POSTGRES

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def apply_migration(sql_file):
    """Führt eine SQL-Migration aus"""
    logger.info(f"Wende Migration an: {sql_file}")
    
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # Teile in einzelne Statements (bei Kommentaren aufpassen)
    statements = [s.strip() for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        for statement in statements:
            if statement.strip():
                logger.info(f"Führe aus: {statement[:60]}...")
                cursor.execute(statement)
        
        conn.commit()
        logger.info(f"✅ Migration erfolgreich: {sql_file}")
    except Exception as e:
        conn.rollback()
        logger.error(f"❌ Migration fehlgeschlagen: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    if not USE_POSTGRES:
        logger.warning("⚠️  SQLite erkannt - Indizes sind für PostgreSQL optimiert, werden aber trotzdem angewendet")
    
    migrations_dir = "migrations"
    if os.path.exists(migrations_dir):
        migration_files = sorted([
            os.path.join(migrations_dir, f) 
            for f in os.listdir(migrations_dir) 
            if f.endswith('.sql')
        ])
        
        for migration_file in migration_files:
            try:
                apply_migration(migration_file)
            except Exception as e:
                logger.error(f"Stoppe Migration-Prozess: {e}")
                break
    else:
        logger.error(f"❌ Migrations-Verzeichnis nicht gefunden: {migrations_dir}")
