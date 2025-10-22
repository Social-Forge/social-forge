CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) DEFAULT 'unknown',
  email VARCHAR(255),
  phone VARCHAR(20),
  avatar_url VARCHAR(255),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE RESTRICT,
  channel_user_id VARCHAR(255) NOT NULL,
  metadata JSONB,
  labels JSONB DEFAULT '[]',
  tags VARCHAR(255)[] DEFAULT '{}',
  is_blocked BOOLEAN DEFAULT FALSE,
  last_contact_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT chk_contact_tenant_id_channel_id_channel_user_id UNIQUE (tenant_id, channel_id, channel_user_id)
);

CREATE INDEX idx_contacts_tenant_id ON contacts(tenant_id);
CREATE INDEX idx_contacts_channel_id ON contacts(channel_id);
CREATE INDEX idx_contacts_channel_user_id ON contacts(channel_user_id);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_is_active ON contacts(is_active);
CREATE INDEX idx_contacts_created_at ON contacts(created_at);
CREATE INDEX idx_contacts_updated_at ON contacts(updated_at);
CREATE INDEX idx_contacts_deleted_at ON contacts(deleted_at);

CREATE TRIGGER update_contacts_modtime
BEFORE UPDATE ON contacts
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

COMMENT ON TABLE contacts IS 'Customer/contact information';