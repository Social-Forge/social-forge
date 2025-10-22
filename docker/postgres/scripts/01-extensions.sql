-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create pgvector extension (jika diinstall manual)
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable additional features
ALTER SYSTEM SET shared_preload_libraries = 'pg_cron';
SELECT pg_reload_conf();