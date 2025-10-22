BEGIN;

DROP TRIGGER IF EXISTS update_pages_modtime ON pages;
DROP TRIGGER IF EXISTS pages_set_published_trigger ON pages;
DROP TRIGGER IF EXISTS tsvector_update ON pages;

DROP FUNCTION IF EXISTS pages_set_published();
DROP FUNCTION IF EXISTS pages_search_update();

DROP INDEX IF EXISTS idx_pages_tenant_id;
DROP INDEX IF EXISTS idx_pages_slug;
DROP INDEX IF EXISTS idx_pages_is_published;
DROP INDEX IF EXISTS idx_pages_is_active;
DROP INDEX IF EXISTS idx_pages_created_at;
DROP INDEX IF EXISTS idx_pages_updated_at;
DROP INDEX IF EXISTS idx_pages_deleted_at;
DROP INDEX IF EXISTS idx_pages_search_gin;
DROP INDEX IF EXISTS idx_pages_search_published_gin;

ALTER TABLE pages DROP CONSTRAINT IF EXISTS chk_pages_tenant_id_slug;

COMMIT;