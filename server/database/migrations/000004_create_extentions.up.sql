BEGIN;
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    CREATE EXTENSION IF NOT EXISTS gin;
    -- Install pg_cron extension terlebih dahulu
    CREATE EXTENSION IF NOT EXISTS pg_cron;
COMMIT;