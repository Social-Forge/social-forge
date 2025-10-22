BEGIN;

DROP TRIGGER IF EXISTS update_webhook_logs_modtime ON webhook_logs;

DROP FUNCTION IF EXISTS update_webhook_logs_modtime();

DROP INDEX IF EXISTS idx_webhook_logs_tenant_id;
DROP INDEX IF EXISTS idx_webhook_logs_channel_integration_id;
DROP INDEX IF EXISTS idx_webhook_logs_event_type;
DROP INDEX IF EXISTS idx_webhook_logs_status;
DROP INDEX IF EXISTS idx_webhook_logs_processed_at;
DROP INDEX IF EXISTS idx_webhook_logs_created_at;
DROP INDEX IF EXISTS idx_webhook_logs_updated_at;
DROP INDEX IF EXISTS idx_webhook_logs_deleted_at;

-- ALTER TABLE webhook_logs DROP CONSTRAINT IF EXISTS chk_webhook_logs_status;

DROP TABLE IF EXISTS webhook_logs;

COMMIT;