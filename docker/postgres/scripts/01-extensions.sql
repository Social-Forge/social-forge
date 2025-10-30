\c postgres
-- Wajib dibuat di database 'postgres' agar pg_cron berfungsi
CREATE EXTENSION IF NOT EXISTS pg_cron;

\c socialforge_db
-- Extension untuk database aplikasi
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;