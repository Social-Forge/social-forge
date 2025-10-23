CREATE TABLE IF NOT EXISTS agent_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  status VARCHAR(255) NOT NULL DEFAULT 'available',
  assigned_count INTEGER NOT NULL DEFAULT 0,
  resolved_count INTEGER NOT NULL DEFAULT 0,
  avg_response_time INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chk_agent_assignment_division_id_user_id UNIQUE (division_id, user_id),
  CONSTRAINT chk_agent_assignment_status CHECK (status IN ('available', 'busy', 'offline'))
);

CREATE INDEX IF NOT EXISTS idx_agent_assignments_tenant_id ON agent_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_division_id ON agent_assignments(division_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_user_id ON agent_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_is_active ON agent_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_status ON agent_assignments(status);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_created_at ON agent_assignments(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_updated_at ON agent_assignments(updated_at);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_deleted_at ON agent_assignments(deleted_at);

CREATE OR REPLACE FUNCTION update_agent_assignments_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_agent_assignments_modtime
BEFORE UPDATE ON agent_assignments
FOR EACH ROW
EXECUTE FUNCTION update_agent_assignments_modtime();
