CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    access_token TEXT NOT NULL UNIQUE,
    refresh_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    last_activity_at TIMESTAMPTZ,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_ip_format CHECK ( ip_address IS NULL OR ip_address ~ '^([0-9a-fA-F:\.]+)$')
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_access_token ON sessions(access_token) WHERE is_revoked = FALSE;
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token) WHERE is_revoked = FALSE;
CREATE INDEX IF NOT EXISTS idx_sessions_ip_address ON sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity_at ON sessions(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions(updated_at);

CREATE OR REPLACE FUNCTION update_sessions_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_sessions_modtime
BEFORE UPDATE ON sessions
FOR EACH ROW
EXECUTE FUNCTION update_sessions_modtime();

