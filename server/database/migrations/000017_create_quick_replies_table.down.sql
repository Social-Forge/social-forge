BEGIN;

DROP TRIGGER IF EXISTS update_quick_replies_modtime ON quick_replies;

DROP FUNCTION IF EXISTS update_quick_replies_modtime();

DROP INDEX IF EXISTS idx_quick_replies_tenant_id;
DROP INDEX IF EXISTS idx_quick_replies_created_by_id;
DROP INDEX IF EXISTS idx_quick_replies_title;
DROP INDEX IF EXISTS idx_quick_replies_shortcut;
DROP INDEX IF EXISTS idx_quick_replies_media_type;
DROP INDEX IF EXISTS idx_quick_replies_is_shared;
DROP INDEX IF EXISTS idx_quick_replies_is_active;
DROP INDEX IF EXISTS idx_quick_replies_created_at;
DROP INDEX IF EXISTS idx_quick_replies_updated_at;
DROP INDEX IF EXISTS idx_quick_replies_deleted_at;

-- ALTER TABLE quick_replies DROP CONSTRAINT IF EXISTS chk_quick_replies_tenant_id_shortcut;
-- ALTER TABLE quick_replies DROP CONSTRAINT IF EXISTS chk_quick_replies_media_type;

DROP TABLE IF EXISTS quick_replies CASCADE;

COMMIT;
