BEGIN;

DROP TRIGGER IF EXISTS update_channel_integrations_modtime ON channel_integrations;

DROP INDEX IF EXISTS idx_channel_integrations_tenant_id;
DROP INDEX IF EXISTS idx_channel_integrations_division_id;
DROP INDEX IF EXISTS idx_channel_integrations_channel_id;
DROP INDEX IF EXISTS idx_channel_integrations_identifier;
DROP INDEX IF EXISTS idx_channel_integrations_type;
DROP INDEX IF EXISTS idx_channel_integrations_is_active;
DROP INDEX IF EXISTS idx_channel_integrations_created_at;
DROP INDEX IF EXISTS idx_channel_integrations_updated_at;
DROP INDEX IF EXISTS idx_channel_integrations_deleted_at;

ALTER TABLE channel_integrations DROP CONSTRAINT IF EXISTS chk_channel_integration_tenant_id_identifier_channel_id;

DROP TABLE IF EXISTS channel_integrations CASCADE;

COMMENT ON TABLE channel_integrations IS 'Tenant channel integrations (WhatsApp, Messenger, etc.)';

COMMIT;