CREATE TABLE auto_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  trigger_type VARCHAR(255) NOT NULL DEFAULT 'first_message',
  trigger_value TEXT,
  message TEXT NOT NULL,
  media_url TEXT,
  media_type VARCHAR(255) NOT NULL DEFAULT 'text',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chk_auto_replies_tenant_id_trigger_type UNIQUE (tenant_id, trigger_type, trigger_value),
  CONSTRAINT chk_auto_replies_trigger_type CHECK (trigger_type IN ('first_message', 'keyword', 'outside_hour')),
  CONSTRAINT chk_auto_replies_media_type CHECK (media_type IN ('text', 'image', 'video', 'audio', 'file', 'location', 'contact', 'button', 'quick_reply'))
);

CREATE INDEX idx_auto_replies_tenant_id ON auto_replies(tenant_id);
CREATE INDEX idx_auto_replies_division_id ON auto_replies(division_id);
CREATE INDEX idx_auto_replies_trigger_type ON auto_replies(trigger_type);
CREATE INDEX idx_auto_replies_trigger_value ON auto_replies(trigger_value);
CREATE INDEX idx_auto_replies_message ON auto_replies(message);
CREATE INDEX idx_auto_replies_media_type ON auto_replies(media_type);
CREATE INDEX idx_auto_replies_is_active ON auto_replies(is_active);
CREATE INDEX idx_auto_replies_created_at ON auto_replies(created_at);
CREATE INDEX idx_auto_replies_updated_at ON auto_replies(updated_at);
CREATE INDEX idx_auto_replies_deleted_at ON auto_replies(deleted_at);

CREATE OR REPLACE FUNCTION update_auto_replies_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_auto_replies_modtime
BEFORE UPDATE ON auto_replies
FOR EACH ROW
EXECUTE FUNCTION update_auto_replies_modtime();
