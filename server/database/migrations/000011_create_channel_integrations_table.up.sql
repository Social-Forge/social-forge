CREATE TABLE channel_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL CHECK (type IN ('whatsapp', 'meta_whatsapp', 'meta_messenger', 'telegram', 'webchat', 'linkchat')),
  identifier VARCHAR(255),
  access_token VARCHAR(255),
  refresh_token VARCHAR(255),
  webhook_url VARCHAR(255),
  webhook_secret VARCHAR(255),
  config JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT chk_channel_integration_tenant_id_identifier_channel_id UNIQUE (tenant_id, identifier, channel_id)
);

CREATE INDEX idx_channel_integrations_tenant_id ON channel_integrations(tenant_id);
CREATE INDEX idx_channel_integrations_division_id ON channel_integrations(division_id);
CREATE INDEX idx_channel_integrations_channel_id ON channel_integrations(channel_id);
CREATE INDEX idx_channel_integrations_identifier ON channel_integrations(identifier);
CREATE INDEX idx_channel_integrations_type ON channel_integrations(type);
CREATE INDEX idx_channel_integrations_is_active ON channel_integrations(is_active);
CREATE INDEX idx_channel_integrations_created_at ON channel_integrations(created_at);
CREATE INDEX idx_channel_integrations_updated_at ON channel_integrations(updated_at);
CREATE INDEX idx_channel_integrations_deleted_at ON channel_integrations(deleted_at);

CREATE TRIGGER update_channel_integrations_modtime
BEFORE UPDATE ON channel_integrations
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

COMMENT ON TABLE channel_integrations IS 'Tenant channel integrations (WhatsApp, Messenger, etc.)';