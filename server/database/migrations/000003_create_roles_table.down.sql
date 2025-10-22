BEGIN;

DROP TRIGGER IF EXISTS update_roles_modtime ON roles;
DROP INDEX IF EXISTS idx_roles_level;
DROP INDEX IF EXISTS idx_roles_created_at;
DROP INDEX IF EXISTS idx_roles_slug;
DROP INDEX IF EXISTS idx_roles_name;
DROP TABLE IF EXISTS roles CASCADE;

COMMIT;