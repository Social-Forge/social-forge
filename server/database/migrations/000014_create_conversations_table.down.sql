BEGIN;

DROP TRIGGER IF EXISTS update_conversations_modtime ON conversations;

DROP INDEX IF EXISTS idx_conversations_tenant_id;
DROP INDEX IF EXISTS idx_conversations_division_id;
DROP INDEX IF EXISTS idx_conversations_assigned_agent_id;
DROP INDEX IF EXISTS idx_conversations_contact_id;
DROP INDEX IF EXISTS idx_conversations_channel_integration_id;
DROP INDEX IF EXISTS idx_conversations_status;
DROP INDEX IF EXISTS idx_conversations_priority;
DROP INDEX IF EXISTS idx_conversations_created_at;
DROP INDEX IF EXISTS idx_conversations_updated_at;
DROP INDEX IF EXISTS idx_conversations_deleted_at;

ALTER TABLE conversations DROP CONSTRAINT IF EXISTS chk_conversation_tenant_id_division_id_assigned_agent_id_contact_id_channel_integration_id;

DROP TABLE IF EXISTS conversations;

COMMIT;