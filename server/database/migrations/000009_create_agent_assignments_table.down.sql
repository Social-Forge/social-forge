BEGIN;

DROP TRIGGER IF EXISTS update_agent_assignments_modtime ON agent_assignments;

DROP INDEX IF EXISTS idx_agent_assignments_tenant_id;
DROP INDEX IF EXISTS idx_agent_assignments_division_id;
DROP INDEX IF EXISTS idx_agent_assignments_user_id;
DROP INDEX IF EXISTS idx_agent_assignments_is_active;
DROP INDEX IF EXISTS idx_agent_assignments_created_at;
DROP INDEX IF EXISTS idx_agent_assignments_updated_at;
DROP INDEX IF EXISTS idx_agent_assignments_deleted_at;
DROP INDEX IF EXISTS idx_agent_assignments_status;

ALTER TABLE agent_assignments DROP CONSTRAINT IF EXISTS chk_agent_assignment_division_id_user_id;
ALTER TABLE agent_assignments DROP CONSTRAINT IF EXISTS chk_agent_assignment_status;

DROP TABLE IF EXISTS agent_assignments CASCADE;

COMMIT;