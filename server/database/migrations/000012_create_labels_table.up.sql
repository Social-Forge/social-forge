CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(255) NOT NULL DEFAULT '#000000',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chk_label_agent_id_name UNIQUE (agent_id, name),
  CONSTRAINT chk_label_agent_id_slug UNIQUE (agent_id, slug)
);

CREATE INDEX idx_labels_tenant_id ON labels(tenant_id);
CREATE INDEX idx_labels_division_id ON labels(division_id);
CREATE INDEX idx_labels_agent_id ON labels(agent_id);
CREATE INDEX idx_labels_name ON labels(name);
CREATE INDEX idx_labels_slug ON labels(slug);
CREATE INDEX idx_labels_is_active ON labels(is_active);
CREATE INDEX idx_labels_created_at ON labels(created_at);
CREATE INDEX idx_labels_updated_at ON labels(updated_at);
CREATE INDEX idx_labels_deleted_at ON labels(deleted_at);

CREATE OR REPLACE FUNCTION update_labels_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_labels_modtime
BEFORE UPDATE ON labels
FOR EACH ROW
EXECUTE FUNCTION update_labels_modtime();
