BEGIN;

DROP TRIGGER IF EXISTS update_working_hours_modtime ON working_hours;

DROP INDEX IF EXISTS idx_working_hours_deleted_at;
DROP INDEX IF EXISTS idx_working_hours_updated_at;
DROP INDEX IF EXISTS idx_working_hours_created_at;
DROP INDEX IF EXISTS idx_working_hours_is_active;
DROP INDEX IF EXISTS idx_working_hours_end_time;
DROP INDEX IF EXISTS idx_working_hours_start_time;
DROP INDEX IF EXISTS idx_working_hours_day_of_week;
DROP INDEX IF EXISTS idx_working_hours_division_id;
DROP INDEX IF EXISTS idx_working_hours_tenant_id;

ALTER TABLE working_hours DROP CONSTRAINT IF EXISTS chk_working_hours_tenant_id_division_id_day_of_week;

DROP TABLE IF EXISTS working_hours;

COMMIT;
