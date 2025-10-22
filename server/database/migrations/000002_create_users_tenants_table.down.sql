BEGIN;

DROP TRIGGER IF EXISTS update_tenants_modtime ON tenants;

DROP FUNCTION IF EXISTS update_tenants_modtime();

DROP INDEX IF EXISTS idx_tenants_slug;
DROP INDEX IF EXISTS idx_tenants_owner_id;
DROP INDEX IF EXISTS idx_tenants_is_active;
DROP INDEX IF EXISTS idx_tenants_subdomain;
DROP INDEX IF EXISTS idx_tenants_created_at;
DROP INDEX IF EXISTS idx_tenants_updated_at;
DROP INDEX IF EXISTS idx_tenants_deleted_at;
DROP INDEX IF EXISTS idx_tenants_subscription_status;

-- ALTER TABLE tenants DROP CONSTRAINT IF EXISTS chk_subscription_plan;
-- ALTER TABLE tenants DROP CONSTRAINT IF EXISTS chk_subscription_status;

DROP TABLE IF EXISTS tenants CASCADE;

COMMIT;