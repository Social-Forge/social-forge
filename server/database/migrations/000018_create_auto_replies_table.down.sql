BEGIN;

DROP TRIGGER IF EXISTS update_auto_replies_modtime ON auto_replies;

DROP INDEX IF EXISTS idx_auto_replies_tenant_id;
DROP INDEX IF EXISTS idx_auto_replies_division_id;
DROP INDEX IF EXISTS idx_auto_replies_trigger_type;
DROP INDEX IF EXISTS idx_auto_replies_trigger_value;
DROP INDEX IF EXISTS idx_auto_replies_message;
DROP INDEX IF EXISTS idx_auto_replies_media_type;
DROP INDEX IF EXISTS idx_auto_replies_is_active;
DROP INDEX IF EXISTS idx_auto_replies_created_at;
DROP INDEX IF EXISTS idx_auto_replies_updated_at;
DROP INDEX IF EXISTS idx_auto_replies_deleted_at;

ALTER TABLE auto_replies DROP CONSTRAINT IF EXISTS chk_auto_replies_tenant_id_trigger_type;
ALTER TABLE auto_replies DROP CONSTRAINT IF EXISTS chk_auto_replies_trigger_type;
ALTER TABLE auto_replies DROP CONSTRAINT IF EXISTS chk_auto_replies_media_type;

DROP TABLE IF EXISTS auto_replies CASCADE;

COMMIT;