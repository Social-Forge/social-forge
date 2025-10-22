BEGIN;

DROP TRIGGER IF EXISTS update_permissions_modtime ON permissions;
DROP INDEX IF EXISTS idx_permissions_slug;
DROP INDEX IF EXISTS idx_permissions_resource;
DROP INDEX IF EXISTS idx_permissions_action;
DROP INDEX IF EXISTS idx_permissions_created_at;
DROP INDEX IF EXISTS idx_permissions_updated_at;
DROP INDEX IF EXISTS idx_permissions_deleted_at;
DROP INDEX IF EXISTS idx_permissions_resource_action;

DROP TABLE IF EXISTS permissions CASCADE;


COMMIT;