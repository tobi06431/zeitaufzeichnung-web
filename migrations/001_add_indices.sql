-- Datenbank-Indizes für Performance-Optimierung
-- Anwendung: psql DATABASE_URL < migrations/001_add_indices.sql

-- Submissions: Schneller Zugriff nach Einreichungsdatum
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at DESC);

-- Timerecords: Schneller Lookup für User + Monat
CREATE INDEX IF NOT EXISTS idx_timerecords_lookup ON timerecords(user_id, month_year);

-- Users: Schneller E-Mail-Lookup (Password-Reset, Login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Profiles: Schneller Zugriff nach user_id (JOIN-Optimierung)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Submissions: JOIN-Optimierung mit users
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);

-- Analyse-Abfrage (optional, nur für PostgreSQL)
-- ANALYZE submissions;
-- ANALYZE timerecords;
-- ANALYZE users;
-- ANALYZE profiles;
