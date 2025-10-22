BEGIN;

DROP TRIGGER IF EXISTS update_permissions_modtime ON permissions;

DROP FUNCTION IF EXISTS update_permissions_modtime();

DROP INDEX IF EXISTS idx_permissions_slug;
DROP INDEX IF EXISTS idx_permissions_resource;
DROP INDEX IF EXISTS idx_permissions_action;
DROP INDEX IF EXISTS idx_permissions_created_at;
DROP INDEX IF EXISTS idx_permissions_updated_at;
DROP INDEX IF EXISTS idx_permissions_deleted_at;
DROP INDEX IF EXISTS idx_permissions_resource_action;

-- ALTER TABLE permissions DROP CONSTRAINT IF EXISTS chk_permission_resource_action;
-- ALTER TABLE permissions DROP CONSTRAINT IF EXISTS chk_permission_resource;
-- ALTER TABLE permissions DROP CONSTRAINT IF EXISTS chk_permission_action;

DROP TABLE IF EXISTS permissions CASCADE;


COMMIT;