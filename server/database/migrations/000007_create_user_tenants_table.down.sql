BEGIN;

DROP TRIGGER IF EXISTS update_user_tenants_modtime ON user_tenants;

DROP FUNCTION IF EXISTS update_user_tenants_modtime();



DROP INDEX IF EXISTS idx_user_tenants_role_id;
DROP INDEX IF EXISTS idx_user_tenants_user_id;
DROP INDEX IF EXISTS idx_user_tenants_tenant_id;
DROP INDEX IF EXISTS idx_user_tenants_is_active;
DROP INDEX IF EXISTS idx_user_tenants_created_at;
DROP INDEX IF EXISTS idx_user_tenants_updated_at;
DROP INDEX IF EXISTS idx_user_tenants_deleted_at;

-- ALTER TABLE user_tenants DROP CONSTRAINT IF EXISTS chk_user_tenant;

DROP TABLE IF EXISTS user_tenants CASCADE;

COMMENT ON TABLE user_tenants IS 'Users can belong to multiple tenants with different roles';

COMMIT;