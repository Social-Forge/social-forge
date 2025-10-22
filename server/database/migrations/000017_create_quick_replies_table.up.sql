CREATE TABLE quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  shortcut VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(255) NOT NULL CHECK (type IN ('text', 'image', 'video', 'audio', 'file', 'location', 'contact', 'button', 'quick_reply')),
  media_url TEXT,
  is_shared BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  meta_data JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT chk_quick_replies_tenant_id_shortcut UNIQUE (tenant_id, shortcut)
);

CREATE INDEX idx_quick_replies_tenant_id ON quick_replies(tenant_id);
CREATE INDEX idx_quick_replies_created_by_id ON quick_replies(created_by_id);
CREATE INDEX idx_quick_replies_title ON quick_replies(title);
CREATE INDEX idx_quick_replies_shortcut ON quick_replies(shortcut);
CREATE INDEX idx_quick_replies_type ON quick_replies(type);
CREATE INDEX idx_quick_replies_is_active ON quick_replies(is_active);
CREATE INDEX idx_quick_replies_created_at ON quick_replies(created_at);
CREATE INDEX idx_quick_replies_updated_at ON quick_replies(updated_at);
CREATE INDEX idx_quick_replies_deleted_at ON quick_replies(deleted_at);

CREATE TRIGGER update_quick_replies_modtime
BEFORE UPDATE ON quick_replies
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();