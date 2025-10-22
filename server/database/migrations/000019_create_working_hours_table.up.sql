CREATE TABLE working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  day_of_week VARCHAR(255) NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chk_working_hours_start_time_end_time CHECK (start_time < end_time),
  CONSTRAINT chk_working_hours_tenant_id_division_id_day_of_week UNIQUE (tenant_id, division_id, day_of_week)
);

CREATE INDEX idx_working_hours_tenant_id ON working_hours(tenant_id);
CREATE INDEX idx_working_hours_division_id ON working_hours(division_id);
CREATE INDEX idx_working_hours_day_of_week ON working_hours(day_of_week);
CREATE INDEX idx_working_hours_start_time ON working_hours(start_time);
CREATE INDEX idx_working_hours_end_time ON working_hours(end_time);
CREATE INDEX idx_working_hours_is_active ON working_hours(is_active);
CREATE INDEX idx_working_hours_created_at ON working_hours(created_at);
CREATE INDEX idx_working_hours_updated_at ON working_hours(updated_at);
CREATE INDEX idx_working_hours_deleted_at ON working_hours(deleted_at);


CREATE TRIGGER update_working_hours_modtime
BEFORE UPDATE ON working_hours
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();