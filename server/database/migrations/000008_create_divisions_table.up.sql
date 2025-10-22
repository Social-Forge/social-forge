CREATE TABLE divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  routing_type VARCHAR(255) DEFAULT 'equal' CHECK (routing_type IN ('equal', 'percentage', 'priority')),
  routing_config JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  link_url VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT chk_division_slug_tenant_id UNIQUE (slug, tenant_id),
  CONSTRAINT chk_division_routing_type CHECK (routing_type IN ('equal', 'percentage', 'priority'))
);

CREATE INDEX idx_divisions_tenant_id ON divisions(tenant_id);
CREATE INDEX idx_divisions_slug ON divisions(tenant_id, slug);
CREATE INDEX idx_divisions_is_active ON divisions(is_active);
CREATE INDEX idx_divisions_link_url ON divisions(link_url);
CREATE INDEX idx_divisions_created_at ON divisions(created_at);
CREATE INDEX idx_divisions_updated_at ON divisions(updated_at);
CREATE INDEX idx_divisions_deleted_at ON divisions(deleted_at);

CREATE TRIGGER update_divisions_modtime
BEFORE UPDATE ON divisions
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

COMMENT ON TABLE divisions IS 'Groups/teams within a tenant (rotator groups)';
COMMENT ON COLUMN divisions.routing_type IS 'equal, percentage, or priority distribution';
COMMENT ON COLUMN divisions.link_url IS 'Public link for this division';
