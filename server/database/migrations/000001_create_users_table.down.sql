BEGIN;

DROP TRIGGER IF EXISTS update_users_modtime ON users;
-- DROP FUNCTION IF EXISTS update_modified_column();

DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_users_is_active;
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_users_updated_at;
DROP INDEX IF EXISTS idx_users_deleted_at;

DROP TABLE IF EXISTS users CASCADE;

COMMIT;