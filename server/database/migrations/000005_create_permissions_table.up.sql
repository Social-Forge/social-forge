CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL;,
  slug VARCHAR(255) UNIQUE NOT NULL,
  resource VARCHAR(255) NOT NULL CHECK (resource IN ('tenants', 'users', 'roles', 'analytics', 'conversations', 'contacts', 'channels', 'quick_replies', 'pages', 'agents', 'webhooks', 'supervisors', 'admin', 'messages', 'labels', 'channels', 'channel_integrations')),
  action VARCHAR(255) NOT NULL CHECK (action IN ('create', 'read', 'write', 'update', 'execute', 'delete', 'manage')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_permissions_slug ON permissions(slug);
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_action ON permissions(action);
CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX idx_permissions_created_at ON permissions(created_at);
CREATE INDEX idx_permissions_updated_at ON permissions(updated_at);
CREATE INDEX idx_permissions_deleted_at ON permissions(deleted_at);



CREATE TRIGGER update_permissions_modtime
BEFORE UPDATE ON permissions
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

COMMENT ON TABLE permissions IS 'Granular permission control';
COMMENT ON COLUMN permissions.resource IS 'Resource type: users, tenants, conversations, etc.';
COMMENT ON COLUMN permissions.action IS 'Action type: create, read, update, delete, manage';