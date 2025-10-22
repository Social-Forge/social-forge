BEGIN;

DROP TRIGGER IF EXISTS update_messages_modtime ON messages;
DROP TRIGGER IF EXISTS tsvector_update ON messages;

DROP FUNCTION IF EXISTS messages_search_update;

DROP INDEX IF EXISTS idx_messages_conversation_id;
DROP INDEX IF EXISTS idx_messages_tenant_id;
DROP INDEX IF EXISTS idx_messages_sender_type_sender_id;
DROP INDEX IF EXISTS idx_messages_channel_message_id;
DROP INDEX IF EXISTS idx_messages_reply_to_id;
DROP INDEX IF EXISTS idx_messages_status;
DROP INDEX IF EXISTS idx_messages_sent_at;
DROP INDEX IF EXISTS idx_messages_delivered_at;
DROP INDEX IF EXISTS idx_messages_read_at;
DROP INDEX IF EXISTS idx_messages_failed_at;
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_messages_updated_at;
DROP INDEX IF EXISTS idx_messages_deleted_at;

-- ALTER TABLE messages DROP CONSTRAINT IF EXISTS chk_message_tenant_id_conversation_id_sender_type_sender_id_channel_message_id; --

DROP TABLE IF EXISTS messages;

COMMIT;