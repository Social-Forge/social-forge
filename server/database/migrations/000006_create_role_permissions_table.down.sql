BEGIN;

DROP TRIGGER IF EXISTS update_role_permissions_modtime ON role_permissions;

DROP FUNCTION IF EXISTS update_role_permissions_modtime();

DROP INDEX IF EXISTS idx_role_permissions_role_id;
DROP INDEX IF EXISTS idx_role_permissions_permission_id;
DROP INDEX IF EXISTS idx_role_permissions_created_at;
DROP INDEX IF EXISTS idx_role_permissions_deleted_at;

-- ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS chk_role_permission_unique;

DROP TABLE IF EXISTS role_permissions;

COMMIT;