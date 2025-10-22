CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL DEFAULT 'guest' CHECK (name IN ('superadmin', 'admin', 'tenant_owner', 'supervisor', 'agent', 'guest')),
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  level INTEGER NOT NULL DEFAULT 0 CHECK (level IN (0, 1, 2, 3, 4, 5)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_slug ON roles(slug);
CREATE INDEX idx_roles_created_at ON roles(created_at);
CREATE INDEX idx_roles_level ON roles(level);

-- Add comments
COMMENT ON TABLE roles IS 'User roles in the system';
COMMENT ON COLUMN roles.level IS '0=guest/default, 1=superadmin, 2=admin, 3=tenant_owner, 4=supervisor, 5=agent';

CREATE TRIGGER update_roles_modtime
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();