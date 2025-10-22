CREATE TABLE user_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chk_user_tenant UNIQUE (user_id, tenant_id)
);

CREATE INDEX idx_user_tenants_role_id ON user_tenants(role_id);
CREATE INDEX idx_user_tenants_user_id ON user_tenants(user_id);
CREATE INDEX idx_user_tenants_tenant_id ON user_tenants(tenant_id);
CREATE INDEX idx_user_tenants_is_active ON user_tenants(is_active);
CREATE INDEX idx_user_tenants_created_at ON user_tenants(created_at);
CREATE INDEX idx_user_tenants_updated_at ON user_tenants(updated_at);
CREATE INDEX idx_user_tenants_deleted_at ON user_tenants(deleted_at);

CREATE TRIGGER update_user_tenants_modtime
BEFORE UPDATE ON user_tenants
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

COMMENT ON TABLE user_tenants IS 'Users can belong to multiple tenants with different roles';