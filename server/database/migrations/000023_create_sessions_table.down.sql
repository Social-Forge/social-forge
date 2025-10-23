BEGIN;

DROP TRIGGER IF EXISTS update_sessions_modtime ON sessions;

DROP FUNCTION IF EXISTS update_sessions_modtime();

DROP INDEX IF EXISTS idx_sessions_user_id;
DROP INDEX IF EXISTS idx_sessions_access_token;
DROP INDEX IF EXISTS idx_sessions_refresh_token;
DROP INDEX IF EXISTS idx_sessions_ip_address;
DROP INDEX IF EXISTS idx_sessions_created_at;
DROP INDEX IF EXISTS idx_sessions_updated_at;

DROP TABLE IF EXISTS sessions;

COMMIT;