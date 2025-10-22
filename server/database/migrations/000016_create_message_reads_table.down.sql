BEGIN;

DROP TRIGGER IF EXISTS update_message_reads_modtime ON message_reads;

DROP FUNCTION IF EXISTS update_message_reads_modtime();

DROP INDEX IF EXISTS idx_message_reads_message_id;
DROP INDEX IF EXISTS idx_message_reads_user_id;
DROP INDEX IF EXISTS idx_message_reads_read_at;
DROP INDEX IF EXISTS idx_message_reads_created_at;
DROP INDEX IF EXISTS idx_message_reads_updated_at;
DROP INDEX IF EXISTS idx_message_reads_deleted_at;

-- ALTER TABLE message_reads DROP CONSTRAINT IF EXISTS chk_message_reads_user_id_message_id;

DROP TABLE IF EXISTS message_reads CASCADE;

COMMIT;