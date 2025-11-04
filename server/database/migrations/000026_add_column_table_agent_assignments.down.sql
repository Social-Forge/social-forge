ALTER TABLE IF EXISTS agent_assignments
DROP COLUMN IF EXISTS percentage;

ALTER TABLE IF EXISTS agent_assignments
DROP COLUMN IF EXISTS weight;

ALTER TABLE IF EXISTS agent_assignments
DROP COLUMN IF EXISTS priority;

ALTER TABLE IF EXISTS agent_assignments
DROP COLUMN IF EXISTS meta_data;