BEGIN;
DROP TRIGGER IF EXISTS update_labels_modtime ON labels;

DROP FUNCTION IF EXISTS update_labels_modtime();

DROP INDEX IF EXISTS idx_labels_tenant_id;
DROP INDEX IF EXISTS idx_labels_division_id;
DROP INDEX IF EXISTS idx_labels_agent_owner_id;
DROP INDEX IF EXISTS idx_labels_name;   
DROP INDEX IF EXISTS idx_labels_slug;
DROP INDEX IF EXISTS idx_labels_is_active;
DROP INDEX IF EXISTS idx_labels_created_at;
DROP INDEX IF EXISTS idx_labels_updated_at;
DROP INDEX IF EXISTS idx_labels_deleted_at;

-- ALTER TABLE labels DROP CONSTRAINT IF EXISTS chk_label_agent_id_name;
-- ALTER TABLE labels DROP CONSTRAINT IF EXISTS chk_label_agent_id_slug;

DROP TABLE IF EXISTS labels CASCADE;

COMMIT;