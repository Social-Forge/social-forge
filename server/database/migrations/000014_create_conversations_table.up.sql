CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  channel_integration_id UUID NOT NULL REFERENCES channel_integrations(id) ON DELETE CASCADE,
  status VARCHAR(255) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'resolved', 'closed', 'archived')),
  priority VARCHAR(255) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  labels JSONB DEFAULT '[]',
  tags VARCHAR(255)[] DEFAULT '{}',
  first_message_at TIMESTAMP WITH TIME ZONE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  assigned_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  message_count INTEGER DEFAULT 0,
  agent_response_time INTERVAL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT chk_conversation_tenant_id_division_id_assigned_agent_id_contact_id_channel_integration_id UNIQUE (tenant_id, division_id, assigned_agent_id, contact_id, channel_integration_id)
);
CREATE INDEX idx_conversations_tenant_id ON conversations(tenant_id);
CREATE INDEX idx_conversations_division_id ON conversations(division_id);
CREATE INDEX idx_conversations_assigned_agent_id ON conversations(assigned_agent_id);
CREATE INDEX idx_conversations_contact_id ON conversations(contact_id);
CREATE INDEX idx_conversations_channel_integration_id ON conversations(channel_integration_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_priority ON conversations(priority);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at);
CREATE INDEX idx_conversations_deleted_at ON conversations(deleted_at);


CREATE TRIGGER update_conversations_modtime
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
