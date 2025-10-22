CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  resource VARCHAR(255) NOT NULL ,
  action VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chk_permission_resource_action UNIQUE (resource, action),
  CONSTRAINT chk_permission_resource CHECK (resource IN ('tenants', 'users', 'roles', 'analytics', 'conversations', 'contacts', 'channels', 'quick_replies', 'pages', 'agents', 'webhooks', 'supervisors', 'admin', 'messages', 'labels', 'channels', 'channel_integrations')),
  CONSTRAINT chk_permission_action CHECK (action IN ('create', 'read', 'write', 'update', 'execute', 'delete', 'manage'))
);

CREATE INDEX idx_permissions_slug ON permissions(slug);
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_action ON permissions(action);
CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX idx_permissions_created_at ON permissions(created_at);
CREATE INDEX idx_permissions_updated_at ON permissions(updated_at);
CREATE INDEX idx_permissions_deleted_at ON permissions(deleted_at);

CREATE OR REPLACE FUNCTION update_permissions_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_permissions_modtime
BEFORE UPDATE ON permissions
FOR EACH ROW
EXECUTE FUNCTION update_permissions_modtime();

COMMENT ON TABLE permissions IS 'Granular permission control';
COMMENT ON COLUMN permissions.resource IS 'Resource type: users, tenants, conversations, etc.';
COMMENT ON COLUMN permissions.action IS 'Action type: create, read, update, delete, manage';