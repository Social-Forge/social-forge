BEGIN;

DROP TRIGGER IF EXISTS update_messages_modtime ON messages;
DROP TRIGGER IF EXISTS trigger_messages_search_update ON messages;
DROP TRIGGER IF EXISTS trigger_refresh_message_mvs ON messages;

DROP FUNCTION IF EXISTS messages_search_update;
DROP FUNCTION IF EXISTS refresh_message_materialized_views;
DROP FUNCTION IF EXISTS refresh_conversation_threads;
DROP FUNCTION IF EXISTS refresh_recent_messages;

DROP MATERIALIZED VIEW IF EXISTS mv_conversation_threads;
DROP MATERIALIZED VIEW IF EXISTS mv_recent_messages;
DROP MATERIALIZED VIEW IF EXISTS mv_message_analytics;
DROP MATERIALIZED VIEW IF EXISTS mv_message_search;

DROP INDEX IF EXISTS idx_messages_conversation_id;
DROP INDEX IF EXISTS idx_messages_tenant_id;
DROP INDEX IF EXISTS idx_messages_sender_type;
DROP INDEX IF EXISTS idx_messages_message_type;
DROP INDEX IF EXISTS idx_messages_sender_id;
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
DROP INDEX IF EXISTS idx_mv_conversation_threads_pk;
DROP INDEX IF EXISTS idx_mv_conversation_threads_conversation_id;
DROP INDEX IF EXISTS idx_mv_conversation_threads_tenant;
DROP INDEX IF EXISTS idx_mv_conversation_threads_sender;
DROP INDEX IF EXISTS idx_mv_conversation_threads_sent_at;
DROP INDEX IF EXISTS idx_mv_message_analytics_pk;
DROP INDEX IF EXISTS idx_mv_message_analytics_date;
DROP INDEX IF EXISTS idx_mv_message_analytics_tenant;
DROP INDEX IF EXISTS idx_mv_recent_messages_pk;
DROP INDEX IF EXISTS idx_mv_recent_messages_tenant;
DROP INDEX IF EXISTS idx_mv_recent_messages_conversation;
DROP INDEX IF EXISTS idx_mv_message_search_pk;
DROP INDEX IF EXISTS idx_mv_message_search_vector;
DROP INDEX IF EXISTS idx_mv_message_search_tenant;
DROP INDEX IF EXISTS idx_mv_message_search_sent_at;
DROP INDEX IF EXISTS idx_mv_message_search_content;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS chk_messages_sender_type;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS chk_messages_message_type;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS chk_messages_status;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS chk_message_content;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS chk_sender_reference;

DROP TABLE IF EXISTS messages CASCADE;

COMMIT;